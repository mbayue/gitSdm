import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type Edge,
  type DefaultEdgeOptions,
} from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import {
  RepoNode,
  FolderNode,
  FileNode,
  PackageNode,
  ContributorNode,
} from "../nodes";
import type { GraphData, GraphNode } from "@/types";
import { useVizStore } from "@/stores/vizStore";
import { getLayoutedElements } from "../layoutClient";
import { NetworkCanvas } from "./ForceGraphCanvas";
import { ExportMapPanel, GraphSidebar } from "../panels";
import { GraphZoomControls } from "./GraphZoomControls";
import { useGraphExport } from "../useGraphExport";

const nodeTypes = {
  repo: RepoNode,
  folder: FolderNode,
  file: FileNode,
  package: PackageNode,
  contributor: ContributorNode,
};

interface GraphCanvasProps {
  graph: GraphData;
  readOnly?: boolean;
  graphDiff?: {
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
  } | null;
  defaultBranch?: string;
}

export function GraphCanvas({
  graph,
  readOnly,
  graphDiff,
  defaultBranch,
}: GraphCanvasProps) {
  const {
    searchQuery,
    nodeTypeFilters,
    diffStatusFilters,
    selectedNodeId,
    highlightedNodeIds,
    setSelectedNodeId,
    setHighlightedNodeIds,
    focusedFilePath,
    setFocusedFilePath,
    layoutType,
    theme,
    activeFocusLayer,
    blastRadiusActive,
    fileTypeFilters,
  } = useVizStore();

  const reactFlowInstance = useReactFlow();
  const { fitView, setCenter } = reactFlowInstance;
  const isDark = theme === "dark";

  const flowStyle = useMemo(
    () =>
      ({
        "--xy-background-color": isDark ? "#0f1015" : "#f9fafb",
        "--xy-controls-button-background-color": isDark
          ? "rgba(24, 24, 27, 0.72)"
          : "rgba(255, 255, 255, 0.86)",
        "--xy-controls-button-background-color-hover": isDark
          ? "rgba(39, 39, 42, 0.95)"
          : "rgba(244, 244, 245, 0.95)",
        "--xy-controls-button-color": isDark
          ? "rgba(244, 244, 245, 0.78)"
          : "rgba(39, 39, 42, 0.78)",
        "--xy-controls-button-color-hover": isDark
          ? "rgb(250, 250, 250)"
          : "rgb(9, 9, 11)",
      }) as CSSProperties,
    [isDark],
  );

  const defaultEdgeOptions = useMemo<DefaultEdgeOptions>(
    () => ({
      type: layoutType === "force" ? "straight" : "smoothstep",
      style: {
        stroke: isDark ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.15)",
        strokeWidth: isDark ? 1.35 : 1.2,
      },
    }),
    [isDark, layoutType],
  );

  // --- Filtering ---

  const filtered = useMemo(() => {
    if (readOnly) return graph;
    const q = searchQuery.toLowerCase();
    let nodes = graph.nodes.filter((n) => nodeTypeFilters.has(n.type));

    if (diffStatusFilters.size > 0) {
      const matchingFilePaths = new Set(
        graph.nodes
          .filter(
            (n) =>
              n.type === "file" &&
              n.data.diffStatus &&
              diffStatusFilters.has(n.data.diffStatus),
          )
          .map((n) => n.data.path),
      );
      nodes = nodes.filter((n) => {
        if (n.type === "file")
          return n.data.diffStatus && diffStatusFilters.has(n.data.diffStatus);
        if (n.type === "folder" || n.type === "repo") {
          const folderPath = n.data.path;
          if (!folderPath) return true;
          for (const fp of matchingFilePaths) {
            if (fp && (fp === folderPath || fp.startsWith(folderPath + "/")))
              return true;
          }
          return false;
        }
        return true;
      });
    }

    if (q) {
      nodes = nodes.filter((n) => {
        const label = n.data.label ? String(n.data.label).toLowerCase() : "";
        const path = n.data.path ? String(n.data.path).toLowerCase() : "";
        return label.includes(q) || path.includes(q);
      });
    }

    if (fileTypeFilters.size > 0) {
      nodes = nodes.filter((n) => {
        if (n.type !== "file") return true;
        const path = n.data.path || n.id || "";
        const dotIdx = path.lastIndexOf(".");
        const ext = dotIdx >= 0 ? path.slice(dotIdx) : "other";
        const label = ext.startsWith(".") ? ext : `.${ext}`;
        return fileTypeFilters.has(label);
      });
    }

    if (activeFocusLayer && activeFocusLayer !== "all") {
      nodes = nodes.filter((n) => {
        if (n.type === "repo") return true;
        const path = n.data.path ? String(n.data.path).toLowerCase() : "";
        const ext = n.data.extension
          ? String(n.data.extension).toLowerCase()
          : "";
        if (activeFocusLayer === "api")
          return (
            path.includes("api") ||
            path.includes("server") ||
            path.includes("route") ||
            path.includes("controller") ||
            path.includes("endpoints")
          );
        if (activeFocusLayer === "ui")
          return (
            path.includes("component") ||
            path.includes("page") ||
            path.includes("style") ||
            path.includes("view") ||
            ["tsx", "jsx", "css"].includes(ext)
          );
        if (activeFocusLayer === "core")
          return (
            path.includes("service") ||
            path.includes("util") ||
            path.includes("helper") ||
            path.includes("lib") ||
            path.includes("core") ||
            ["rs", "go", "py", "ts", "js"].includes(ext)
          );
        if (activeFocusLayer === "config")
          return (
            ext === "json" ||
            ext === "yaml" ||
            ext === "yml" ||
            ext === "toml" ||
            path.includes("config") ||
            path.includes("webpack") ||
            path.includes("vite")
          );
        return true;
      });
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    );
    return { nodes, edges };
  }, [
    graph,
    searchQuery,
    nodeTypeFilters,
    diffStatusFilters,
    fileTypeFilters,
    readOnly,
    activeFocusLayer,
  ]);

  // --- Layout & derived data ---

  const layouted = useMemo(
    () =>
      getLayoutedElements(
        filtered.nodes as Node[],
        filtered.edges as Edge[],
        layoutType === "network" ? "force" : layoutType,
      ),
    [filtered, layoutType],
  );

  const connectedNodeIdsByNodeId = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    for (const edge of filtered.edges) {
      if (!lookup.has(edge.source))
        lookup.set(edge.source, new Set([edge.source]));
      if (!lookup.has(edge.target))
        lookup.set(edge.target, new Set([edge.target]));
      lookup.get(edge.source)?.add(edge.target);
      lookup.get(edge.target)?.add(edge.source);
      lookup.get(edge.source)?.add(edge.source);
      lookup.get(edge.target)?.add(edge.target);
    }
    return lookup;
  }, [filtered.edges]);

  const diffCounts = useMemo(() => {
    const counts = { added: 0, modified: 0, deleted: 0 };
    for (const n of graph.nodes) {
      if (n.type === "file" && n.data.diffStatus) {
        if (n.data.diffStatus === "added") counts.added++;
        else if (n.data.diffStatus === "modified") counts.modified++;
        else if (n.data.diffStatus === "deleted") counts.deleted++;
      }
    }
    return counts;
  }, [graph.nodes]);

  const fileTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of graph.nodes) {
      if (node.type !== "file") continue;
      const ext = node.data.extension || node.data.fileClass || "other";
      const label = ext.startsWith(".") ? ext : `.${ext}`;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [graph.nodes]);

  const communityCount = useMemo(() => {
    const communities = new Set(
      filtered.nodes.map((n) => n.data.fileClass || n.type),
    );
    return communities.size;
  }, [filtered.nodes]);

  // Node Info Panel data
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = filtered.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const degree = connectedNodeIdsByNodeId.get(node.id)?.size ?? 0;
    return {
      id: node.id,
      label: node.data.label || node.id,
      fileType: node.data.extension || node.type,
      communityName: node.type.charAt(0).toUpperCase() + node.type.slice(1),
      degree: degree > 0 ? degree - 1 : 0, // subtract self
      sourceFile: node.data.path,
      color: node.data.nodeColor || "#8b5cf6",
    };
  }, [selectedNodeId, filtered.nodes, connectedNodeIdsByNodeId]);

  const selectedNeighbors = useMemo(() => {
    if (!selectedNodeId) return [];
    return Array.from(connectedNodeIdsByNodeId.get(selectedNodeId) ?? [])
      .filter((id) => id !== selectedNodeId)
      .map((id) => filtered.nodes.find((n) => n.id === id))
      .filter((n): n is GraphNode => Boolean(n))
      .map((n) => ({
        id: n.id,
        label: n.data.label || n.id,
        fileType: n.data.extension || n.type,
        communityName: n.type.charAt(0).toUpperCase() + n.type.slice(1),
        degree: (connectedNodeIdsByNodeId.get(n.id)?.size ?? 1) - 1,
        sourceFile: n.data.path,
        color: n.data.nodeColor || "#8b5cf6",
      }))
      .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label));
  }, [selectedNodeId, connectedNodeIdsByNodeId, filtered.nodes]);

  // --- ReactFlow nodes/edges state ---

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
        blastRadiusActive,
      ),
    }));

    const edgesWithStyles = rawEdges.map((e) => {
      const isSelectedNodeConnected =
        selectedNodeId &&
        (e.source === selectedNodeId || e.target === selectedNodeId);
      const isBlastRadiusPropagation =
        blastRadiusActive &&
        highlightedNodeIds.has(e.source) &&
        highlightedNodeIds.has(e.target) &&
        e.type === "imports";
      return {
        ...e,
        type: layoutType === "force" ? "default" : "smoothstep",
        style: getEdgeStyle(
          e,
          selectedNodeId,
          highlightedNodeIds,
          nodeById,
          theme,
          blastRadiusActive,
        ),
        animated: !!isSelectedNodeConnected || isBlastRadiusPropagation,
      };
    });

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

  // --- View centering ---

  useEffect(() => {
    if (selectedNodeId || focusedFilePath) return;
    const timer = setTimeout(() => {
      fitView({ duration: 400, padding: 0.35 });
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutType, fitView, graph, selectedNodeId, focusedFilePath]);

  const lastCenteredIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const activeId =
      selectedNodeId || (focusedFilePath ? `file:${focusedFilePath}` : null);
    if (!activeId) {
      lastCenteredIdRef.current = null;
      return;
    }
    if (lastCenteredIdRef.current === activeId) return;

    const targetNode = nodes.find(
      (n) =>
        n.id === activeId || (n.data?.path && n.data.path === focusedFilePath),
    );
    if (targetNode) {
      lastCenteredIdRef.current = activeId;
      const x =
        targetNode.position.x +
        (targetNode.measured?.width ?? targetNode.width ?? 120) / 2;
      const y =
        targetNode.position.y +
        (targetNode.measured?.height ?? targetNode.height ?? 36) / 2;
      const timer = setTimeout(() => {
        setCenter(x, y, { zoom: 1.3, duration: 600 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, focusedFilePath, nodes, setCenter]);

  // --- Blast radius ---

  const getBlastRadiusNodeIds = useCallback(
    (selectedId: string, allNodes: Node[], allEdges: Edge[]): Set<string> => {
      const affected = new Set<string>([selectedId]);
      const queue: string[] = [];
      const targetNode = allNodes.find((n) => n.id === selectedId);
      if (!targetNode) return affected;

      if (targetNode.type === "file") {
        queue.push(selectedId);
      } else if (targetNode.type === "folder") {
        const folderPath = targetNode.data?.path as string;
        if (folderPath) {
          for (const n of allNodes) {
            if (
              n.type === "file" &&
              n.data?.path &&
              (n.data.path as string).startsWith(folderPath + "/")
            ) {
              affected.add(n.id);
              queue.push(n.id);
            }
          }
        }
      }

      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const edge of allEdges) {
          if (edge.target === curr && edge.type === "imports") {
            if (!affected.has(edge.source)) {
              affected.add(edge.source);
              queue.push(edge.source);
            }
          }
        }
      }
      return affected;
    },
    [],
  );

  useEffect(() => {
    if (!selectedNodeId) {
      setHighlightedNodeIds(new Set());
      return;
    }
    if (blastRadiusActive) {
      setHighlightedNodeIds(
        getBlastRadiusNodeIds(
          selectedNodeId,
          layouted.nodes as Node[],
          layouted.edges as Edge[],
        ),
      );
    } else {
      setHighlightedNodeIds(
        new Set(
          connectedNodeIdsByNodeId.get(selectedNodeId) ?? [selectedNodeId],
        ),
      );
    }
  }, [
    blastRadiusActive,
    selectedNodeId,
    layouted,
    connectedNodeIdsByNodeId,
    setHighlightedNodeIds,
    getBlastRadiusNodeIds,
  ]);

  // --- Event handlers ---

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      lastCenteredIdRef.current = null;
      setSelectedNodeId(node.id);
      if (node.type === "file" && node.data?.path)
        setFocusedFilePath(node.data.path as string);
    },
    [readOnly, setSelectedNodeId, setFocusedFilePath],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setHighlightedNodeIds(new Set());
  }, [setSelectedNodeId, setHighlightedNodeIds]);

  // --- Export ---

  const { owner = "", repo = "" } = useParams();
  const exportViewportRef = useRef<{
    x: number;
    y: number;
    zoom: number;
  } | null>(null);
  const { handleExport, isExporting, exportFormat } = useGraphExport({
    mode: "dom",
    owner,
    repo,
    filenameSuffix: "dependency_map",
    backgroundColor: isDark ? "#0f0f1a" : "#f9fafb",
    getElement: () =>
      document.querySelector(".react-flow") as HTMLElement | null,
    beforeExport: async () => {
      exportViewportRef.current = {
        ...reactFlowInstance.getViewport(),
        zoom: reactFlowInstance.getZoom(),
      };
      reactFlowInstance.fitView({ padding: 0.1 });
      await new Promise((resolve) => setTimeout(resolve, 250));
    },
    afterExport: () => {
      const viewport = exportViewportRef.current;
      if (viewport) reactFlowInstance.setViewport(viewport, { duration: 150 });
      exportViewportRef.current = null;
    },
  });

  // --- Render ---

  const isLoading = !graph || !graph.nodes;
  const isEmpty = filtered.nodes.length === 0;

  if (layoutType === "network") {
    return (
      <NetworkCanvas
        graph={filtered}
        allNodes={graph.nodes}
        readOnly={readOnly}
        diffCounts={diffCounts}
        graphDiff={graphDiff}
        defaultBranch={defaultBranch}
      />
    );
  }

  return (
    <div className="graph-canvas-host h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm select-none">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className="mt-3 text-xs text-zinc-400 font-medium">
            Laying out dependency graph...
          </span>
        </div>
      )}
      {isExporting && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md select-none">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <span className="mt-3 text-xs text-zinc-400 font-medium font-mono">
            Generating high-res {exportFormat?.toUpperCase()}...
          </span>
        </div>
      )}
      {!isLoading && isEmpty && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-[#0f0f1a]">
          <div className="pointer-events-none rounded-xl border border-white/10 bg-[#1a1a2e]/80 px-6 py-5 text-center backdrop-blur-md select-none">
            <div className="text-sm font-semibold text-zinc-300">
              No nodes match current filters
            </div>
            <div className="mt-1.5 text-[11px] text-zinc-500 font-mono">
              Try re-enabling node type or diff status filters in the analysis
              panel.
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        className="canvas-flow-bg"
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1.1 }}
        minZoom={0.05}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        onlyRenderVisibleElements
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        style={flowStyle}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={isDark ? "rgba(255, 255, 255, 0.085)" : "rgba(0, 0, 0, 0.08)"}
        />
        {!readOnly && !isEmpty && (
          <GraphZoomControls
            onZoomIn={() => reactFlowInstance.zoomIn({ duration: 300 })}
            onZoomOut={() => reactFlowInstance.zoomOut({ duration: 300 })}
            onFitView={() => fitView({ duration: 400, padding: 0.35 })}
          />
        )}
      </ReactFlow>

      {/* Export Panel */}
      {!readOnly && !isEmpty && (
        <ExportMapPanel
          onExport={handleExport}
          isExporting={isExporting}
          exportFormat={exportFormat}
        />
      )}

      {/* Graph Sidebar */}
      {!readOnly && (
        <GraphSidebar
          fileTypeCounts={fileTypeCounts}
          stats={{
            nodes: filtered.nodes.length,
            edges: filtered.edges.length,
            communities: communityCount,
          }}
          diffCounts={diffCounts}
          isEmpty={isEmpty}
          graphDiff={graphDiff}
          defaultBranch={defaultBranch}
          selectedNode={selectedNodeData}
          neighbors={
            blastRadiusActive
              ? Array.from(highlightedNodeIds)
                  .filter((id) => id !== selectedNodeId)
                  .map((id) => filtered.nodes.find((n) => n.id === id))
                  .filter((n): n is GraphNode => Boolean(n))
                  .map((n) => ({
                    id: n.id,
                    label: n.data.label || n.id,
                    fileType: n.data.extension || n.type,
                    communityName:
                      n.type.charAt(0).toUpperCase() + n.type.slice(1),
                    degree: (connectedNodeIdsByNodeId.get(n.id)?.size ?? 1) - 1,
                    sourceFile: n.data.path,
                    color: n.data.nodeColor || "#8b5cf6",
                  }))
              : selectedNeighbors
          }
          onNodeClick={(node) => {
            const target = nodes.find((n) => n.id === node.id);
            if (target) {
              lastCenteredIdRef.current = null;
              setSelectedNodeId(target.id);
              if (target.type === "file" && target.data?.path)
                setFocusedFilePath(target.data.path as string);
              const x =
                target.position.x +
                (target.measured?.width ?? target.width ?? 120) / 2;
              const y =
                target.position.y +
                (target.measured?.height ?? target.height ?? 36) / 2;
              setCenter(x, y, { zoom: 1.3, duration: 600 });
            }
          }}
        />
      )}
    </div>
  );
}

// --- Utility functions ---

function getNodeClassName(
  node: GraphNode | Node,
  selectedId: string | null,
  highlighted: Set<string>,
  blastRadiusActive: boolean,
): string {
  if (!selectedId) return "";
  if (node.id === selectedId)
    return blastRadiusActive ? "selected epicenter-pulse" : "selected";
  if (highlighted.has(node.id))
    return blastRadiusActive ? "affected-highlight" : "";
  return "dimmed";
}

function getEdgeStyle(
  edge: { source: string; target: string; type?: string },
  selectedId: string | null,
  highlighted: Set<string>,
  nodes: Map<string, Node>,
  theme: "dark" | "light",
  blastRadiusActive: boolean,
): React.CSSProperties {
  const targetNode = nodes.get(edge.target);
  const sourceNode = nodes.get(edge.source);
  const isDeleted =
    targetNode?.data?.diffStatus === "deleted" ||
    sourceNode?.data?.diffStatus === "deleted";

  if (isDeleted) {
    return {
      stroke:
        theme === "dark"
          ? "rgba(239, 68, 68, 0.35)"
          : "rgba(239, 68, 68, 0.25)",
      strokeWidth: 1.2,
      strokeDasharray: "3,3",
    };
  }

  if (blastRadiusActive) {
    if (
      edge.type === "imports" &&
      highlighted.has(edge.source) &&
      highlighted.has(edge.target)
    ) {
      return {
        stroke: edge.target === selectedId ? "#ef4444" : "#f59e0b",
        strokeWidth: 2,
        opacity: 1,
        transition: "stroke 0.2s, stroke-width 0.2s",
      };
    }
    return {
      stroke:
        theme === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
      strokeWidth: 1,
      opacity: 0.08,
      transition: "stroke 0.2s, stroke-width 0.2s",
    };
  }

  const defaultStyle = {
    stroke:
      theme === "dark" ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.15)",
    strokeWidth: theme === "dark" ? 1.35 : 1.2,
    transition: "stroke 0.2s, stroke-width 0.2s",
  };
  if (!selectedId) return defaultStyle;

  const isConnected = edge.source === selectedId || edge.target === selectedId;
  if (isConnected) {
    return {
      stroke: (targetNode?.data?.nodeColor as string) ?? "#fbbf24",
      strokeWidth: 2,
      opacity: 1,
      transition: "stroke 0.2s, stroke-width 0.2s",
    };
  }

  if (highlighted.has(edge.source) && highlighted.has(edge.target)) {
    return {
      stroke:
        theme === "dark" ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.35)",
      strokeWidth: theme === "dark" ? 1.45 : 1.2,
      opacity: 0.8,
      transition: "stroke 0.2s, stroke-width 0.2s",
    };
  }

  return {
    stroke:
      theme === "dark" ? "rgba(255, 255, 255, 0.11)" : "rgba(0, 0, 0, 0.05)",
    strokeWidth: 1,
    opacity: 0.15,
    transition: "stroke 0.2s, stroke-width 0.2s",
  };
}
