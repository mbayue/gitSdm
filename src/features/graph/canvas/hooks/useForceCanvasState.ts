import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { GraphNode, GraphEdge } from "@/types";
import { useVizStore } from "@/stores/vizStore";
import { buildForceGraphData } from "../../force/buildForceGraphData";
import { computeBlastRadius } from "../../force/forceGraphUtils";
import { useGraphExport } from "../../useGraphExport";
import { useD3Physics } from "../force/useD3Physics";
import { useForceSync } from "../force/useForceSync";
import type { ForceGraphNode, ForceGraphLink } from "../../force/forceGraphConstants";
import type { ForceGraphMethods } from "react-force-graph-2d";

interface UseForceCanvasStateProps {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  forceHostRef: React.MutableRefObject<HTMLDivElement | null>;
  forceInitialViewDoneRef: React.MutableRefObject<boolean>;
}

export function useForceCanvasState({
  graph,
  forceGraphRef,
  forceHostRef,
  forceInitialViewDoneRef,
}: UseForceCanvasStateProps) {
  const {
    selectedNodeId,
    setSelectedNodeId,
    highlightedNodeIds,
    setHighlightedNodeIds,
    setFocusedFilePath,
    focusedFilePath,
    layoutType,
    nodeTypeFilters,
    blastRadiusActive,
    fileTypeFilters,
    compareBranch,
    setActiveDropdown,
    graphActionTrigger,
  } = useVizStore();

  const [forceSize, setForceSize] = useState({ width: 1024, height: 720 });
  const [hoveredForceNode, setHoveredForceNode] = useState<ForceGraphNode | null>(null);
  const { owner = "", repo = "" } = useParams();

  const { isExporting, exportFormat } = useGraphExport({
    mode: "force",
    forceGraphRef,
    forceHostRef,
    owner,
    repo,
    filenameSuffix: "force_graph",
  });

  const connectedNodeIdsByNodeId = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
      if (!lookup.has(edge.source)) lookup.set(edge.source, new Set([edge.source]));
      if (!lookup.has(edge.target)) lookup.set(edge.target, new Set([edge.target]));
      lookup.get(edge.source)?.add(edge.target);
      lookup.get(edge.target)?.add(edge.source);
    }
    return lookup;
  }, [graph.edges]);

  const forceGraphData = useMemo(
    () =>
      buildForceGraphData(graph.nodes, graph.edges, {
        nodeTypeFilters,
        fileTypeFilters,
      }),
    [graph.nodes, graph.edges, nodeTypeFilters, fileTypeFilters]
  );

  const forceNodeById = useMemo(
    () => new Map(forceGraphData.nodes.map((n) => [n.id, n])),
    [forceGraphData.nodes]
  );

  const blastRadiusNodeIds = useMemo(() => {
    if (!blastRadiusActive || !selectedNodeId) return new Set<string>();
    if (!forceNodeById.get(selectedNodeId)) return new Set<string>();
    return computeBlastRadius(selectedNodeId, graph.edges);
  }, [blastRadiusActive, selectedNodeId, forceNodeById, graph.edges]);

  useEffect(() => {
    if (!selectedNodeId) {
      setHighlightedNodeIds(new Set());
      return;
    }
    if (blastRadiusActive) {
      setHighlightedNodeIds(blastRadiusNodeIds);
    } else {
      setHighlightedNodeIds(
        new Set(connectedNodeIdsByNodeId.get(selectedNodeId) ?? [selectedNodeId])
      );
    }
  }, [
    blastRadiusActive,
    selectedNodeId,
    blastRadiusNodeIds,
    connectedNodeIdsByNodeId,
    setHighlightedNodeIds,
  ]);

  useEffect(() => {
    forceInitialViewDoneRef.current = false;
  }, [forceGraphData.nodes.length, forceGraphData.links.length, forceInitialViewDoneRef]);

  useEffect(() => {
    if (layoutType !== "network" || !forceHostRef.current) return;
    const host = forceHostRef.current;
    const updateSize = () => {
      const rect = host.getBoundingClientRect();
      setForceSize({
        width: Math.max(320, rect.width),
        height: Math.max(320, rect.height),
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [layoutType, forceHostRef]);

  useD3Physics({
    layoutType,
    forceGraphRef,
    nodes: forceGraphData.nodes,
  });

  const { prevFocusRef } = useForceSync({
    layoutType,
    selectedNodeId,
    focusedFilePath,
    nodes: forceGraphData.nodes,
    graphActionTrigger,
    forceGraphRef,
    forceInitialViewDoneRef,
  });

  return {
    selectedNodeId,
    setSelectedNodeId,
    highlightedNodeIds,
    setHighlightedNodeIds,
    setFocusedFilePath,
    focusedFilePath,
    compareBranch,
    setActiveDropdown,
    forceSize,
    hoveredForceNode,
    setHoveredForceNode,
    isExporting,
    exportFormat,
    forceGraphData,
    forceNodeById,
    blastRadiusActive,
    prevFocusRef,
  };
}
