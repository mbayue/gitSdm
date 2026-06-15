import { useEffect, useRef, useState } from "react";
import { useNodesState, useEdgesState, type Node, type Edge } from "@xyflow/react";
import { getNodeClassName, getEdgeStyle } from "../helpers/edgeStyles";

interface UseGraphLayoutProps {
  filtered: { nodes: Node[]; edges: Edge[] };
  layoutType: string;
  theme: "dark" | "light";
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  blastRadiusActive: boolean;
}

export function useGraphLayout({
  filtered,
  layoutType,
  theme,
  selectedNodeId,
  highlightedNodeIds,
  blastRadiusActive,
}: UseGraphLayoutProps) {
  const [layouted, setLayouted] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const [isCalculatingLayout, setIsCalculatingLayout] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const layoutReqIdRef = useRef(0);

  useEffect(() => {
    workerRef.current = new Worker(new URL("../../layoutWorker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current.onmessage = (e) => {
      if (e.data.type === "SUCCESS" && e.data.reqId === layoutReqIdRef.current) {
        setLayouted(e.data.result);
        setIsCalculatingLayout(false);
      } else if (e.data.type === "ERROR" && e.data.reqId === layoutReqIdRef.current) {
        console.error("Layout worker error:", e.data.error);
        setIsCalculatingLayout(false);
      }
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    if (filtered.nodes.length === 0) {
      setLayouted({ nodes: [], edges: [] });
      setIsCalculatingLayout(false);
      return;
    }
    setIsCalculatingLayout(true);
    layoutReqIdRef.current += 1;
    workerRef.current.postMessage({
      nodes: filtered.nodes,
      edges: filtered.edges,
      layoutType: layoutType === "network" ? "force" : layoutType,
      reqId: layoutReqIdRef.current,
    });
  }, [filtered, layoutType]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const rawNodes = layouted.nodes;
    const rawEdges = layouted.edges;
    const nodeById = new Map(rawNodes.map((node) => [node.id, node]));

    const nodesWithClasses = rawNodes.map((n) => ({
      ...n,
      className: getNodeClassName(
        n,
        selectedNodeId,
        highlightedNodeIds,
        blastRadiusActive
      ),
    }));

    const edgesWithStyles = rawEdges.map((e) => ({
      ...e,
      type: layoutType === "force" ? "default" : "smoothstep",
      style: getEdgeStyle(
        e,
        selectedNodeId,
        highlightedNodeIds,
        nodeById,
        theme,
        blastRadiusActive
      ),
    }));

    setNodes(nodesWithClasses as Node[]);
    setEdges(edgesWithStyles as Edge[]);
  }, [
    layouted,
    selectedNodeId,
    highlightedNodeIds,
    layoutType,
    theme,
    setNodes,
    setEdges,
    blastRadiusActive,
  ]);

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    isCalculatingLayout,
  };
}
