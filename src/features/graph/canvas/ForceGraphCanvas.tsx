import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { forceCollide, forceRadial } from "d3-force";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { GraphData, GraphEdge, GraphNode } from "@/types";
import { useVizStore } from "@/stores/vizStore";
import { ExportMapPanel, GraphSidebar, type GraphDiff } from "../panels";
import {
  type ForceGraphNode,
  type ForceGraphLink,
  DIFF_STATUS_COLORS,
} from "../force/forceGraphConstants";
import {
  getForceNodeRadius,
  getForceLinkColor,
  computeBlastRadius,
} from "../force/forceGraphUtils";
import { buildForceGraphData } from "../force/buildForceGraphData";
import { useGraphExport } from "../useGraphExport";
import { GraphZoomControls } from "./GraphZoomControls";

type NetworkGraphData =
  | Pick<GraphData, "nodes" | "edges">
  | {
      nodes: GraphNode[];
      edges: GraphEdge[];
    };

interface NetworkCanvasProps {
  graph: NetworkGraphData;
  allNodes?: GraphNode[];
  readOnly?: boolean;
  diffCounts?: { added: number; modified: number; deleted: number };
  graphDiff?: GraphDiff | null;
  defaultBranch?: string;
}

export function NetworkCanvas({
  graph,
  allNodes,
  readOnly,
  diffCounts = { added: 0, modified: 0, deleted: 0 },
  graphDiff,
  defaultBranch,
}: NetworkCanvasProps) {
  const {
    selectedNodeId,
    highlightedNodeIds,
    setSelectedNodeId,
    setHighlightedNodeIds,
    setFocusedFilePath,
    focusedFilePath,
    layoutType,
    nodeTypeFilters,
    fileTypeFilters,
    compareBranch,
    blastRadiusActive,
  } = useVizStore();

  const forceGraphRef = useRef<
    ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined
  >(undefined);
  const forceHostRef = useRef<HTMLDivElement | null>(null);
  const forceInitialViewDoneRef = useRef(false);
  const [forceSize, setForceSize] = useState({ width: 1024, height: 720 });
  const [hoveredForceNode, setHoveredForceNode] =
    useState<ForceGraphNode | null>(null);
  const { owner = "", repo = "" } = useParams();

  const { handleExport, isExporting, exportFormat } = useGraphExport({
    mode: "force",
    forceGraphRef,
    forceHostRef,
    owner,
    repo,
    filenameSuffix: "force_graph",
  });

  // --- Derived data ---

  const connectedNodeIdsByNodeId = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
      if (!lookup.has(edge.source))
        lookup.set(edge.source, new Set([edge.source]));
      if (!lookup.has(edge.target))
        lookup.set(edge.target, new Set([edge.target]));
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
    [graph.nodes, graph.edges, nodeTypeFilters, fileTypeFilters],
  );

  const forceNodeById = useMemo(
    () => new Map(forceGraphData.nodes.map((n) => [n.id, n])),
    [forceGraphData.nodes],
  );
  const selectedForceNode = selectedNodeId
    ? (forceNodeById.get(selectedNodeId) ?? null)
    : null;

  const fileTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const sourceNodes = allNodes ?? graph.nodes;
    for (const node of sourceNodes) {
      if (node.type !== "file") continue;
      const ext = node.data.extension || node.data.fileClass || "other";
      const label = ext.startsWith(".") ? ext : `.${ext}`;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [allNodes, graph.nodes]);

  const communityCount = useMemo(
    () => new Set(forceGraphData.nodes.map((n) => n.community)).size,
    [forceGraphData.nodes],
  );

  const selectedForceNeighbors = useMemo(() => {
    if (!selectedNodeId) return [];
    return Array.from(connectedNodeIdsByNodeId.get(selectedNodeId) ?? [])
      .filter((id) => id !== selectedNodeId)
      .map((id) => forceNodeById.get(id))
      .filter((node): node is ForceGraphNode => Boolean(node))
      .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label));
  }, [connectedNodeIdsByNodeId, forceNodeById, selectedNodeId]);

  const blastRadiusNodeIds = useMemo(() => {
    if (!blastRadiusActive || !selectedNodeId) return new Set<string>();
    if (!forceNodeById.get(selectedNodeId)) return new Set<string>();
    return computeBlastRadius(selectedNodeId, graph.edges);
  }, [blastRadiusActive, selectedNodeId, forceNodeById, graph.edges]);

  // --- Effects ---

  useEffect(() => {
    if (!selectedNodeId) {
      setHighlightedNodeIds(new Set());
      return;
    }
    if (blastRadiusActive) {
      setHighlightedNodeIds(blastRadiusNodeIds);
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
    blastRadiusNodeIds,
    connectedNodeIdsByNodeId,
    setHighlightedNodeIds,
  ]);

  useEffect(() => {
    forceInitialViewDoneRef.current = false;
  }, [forceGraphData.nodes.length, forceGraphData.links.length]);

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
  }, [layoutType]);

  useEffect(() => {
    if (layoutType !== "network") return;
    const ref = forceGraphRef.current;
    if (!ref) return;
    const nodeCount = forceGraphData.nodes.length;
    const radius = Math.max(80, Math.sqrt(nodeCount) * 18);

    ref.d3Force("charge")?.strength(-100);
    ref.d3Force("link")?.distance(30).strength(0.8);

    // Radial force: push nodes into a circular shape
    // Nodes with higher degree stay closer to center, leaf nodes go to the edge
    const maxDegree = Math.max(1, ...forceGraphData.nodes.map((n) => n.degree));
    ref.d3Force(
      "radial",
      forceRadial(
        (node: unknown) => {
          const d = (node as ForceGraphNode).degree;
          // High degree = closer to center (smaller radius), low degree = outer ring
          const normalized = 1 - d / maxDegree;
          return radius * 0.2 + radius * 0.8 * normalized;
        },
        0,
        0,
      ).strength(0.3),
    );

    ref.d3ReheatSimulation();
  }, [layoutType, forceGraphData]);

  useEffect(() => {
    if (layoutType !== "network" || !forceGraphRef.current) return;
    const timeout = window.setTimeout(() => {
      const g = forceGraphRef.current;
      if (!g) return;
      g.d3Force(
        "collide",
        forceCollide()
          .radius(
            (node: unknown) => getForceNodeRadius(node as ForceGraphNode) + 4,
          )
          .strength(0.35),
      );
      g.d3ReheatSimulation();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [layoutType, forceGraphData.nodes.length]);

  // --- Focus sync: center graph when selectedNodeId/focusedFilePath changes externally ---
  const prevFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (layoutType !== "network") return;

    const targetId =
      selectedNodeId || (focusedFilePath ? `file:${focusedFilePath}` : null);
    if (!targetId) {
      prevFocusRef.current = null;
      return;
    }
    if (prevFocusRef.current === targetId) return;

    let attempts = 0;
    let timer: number | undefined;

    const focusTarget = () => {
      const ref = forceGraphRef.current;
      if (!ref) return;

      const nodes = forceGraphData.nodes;
      const node = nodes.find(
        (n) =>
          n.id === targetId ||
          (focusedFilePath &&
            (n.sourceFile === focusedFilePath ||
              n.id === `file:${focusedFilePath}`)),
      );

      if (node && typeof node.x === "number" && typeof node.y === "number") {
        forceInitialViewDoneRef.current = true;
        ref.centerAt(node.x, node.y, 600);
        ref.zoom(3.2, 600);
        prevFocusRef.current = targetId;
        return;
      }

      attempts += 1;
      if (attempts < 20) timer = window.setTimeout(focusTarget, 150);
    };

    timer = window.setTimeout(focusTarget, 80);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [layoutType, selectedNodeId, focusedFilePath, forceGraphData.nodes]);

  // --- Callbacks ---

  const focusForceNode = useCallback(
    (node: ForceGraphNode) => {
      prevFocusRef.current = node.id; // prevent effect from double-centering
      setSelectedNodeId(node.id);
      setHighlightedNodeIds(
        new Set(connectedNodeIdsByNodeId.get(node.id) ?? [node.id]),
      );
      setFocusedFilePath(
        node.nodeType === "file" && node.sourceFile ? node.sourceFile : null,
      );
      if (typeof node.x === "number" && typeof node.y === "number") {
        forceGraphRef.current?.centerAt(node.x, node.y, 600);
        forceGraphRef.current?.zoom(3.2, 600);
      }
    },
    [
      connectedNodeIdsByNodeId,
      setFocusedFilePath,
      setHighlightedNodeIds,
      setSelectedNodeId,
    ],
  );

  const onForceBackgroundClick = useCallback(() => {
    prevFocusRef.current = null;
    setSelectedNodeId(null);
    setHighlightedNodeIds(new Set());
    setHoveredForceNode(null);
  }, [setHighlightedNodeIds, setSelectedNodeId]);

  // --- Render ---

  const isLoading = !graph || !graph.nodes;
  const isEmpty = graph.nodes.length === 0;

  return (
    <div
      ref={forceHostRef}
      className="graph-canvas-host network-force-host h-full w-full relative overflow-hidden bg-[#0f0f1a]"
    >
      {isLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm select-none">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className="mt-3 text-xs text-zinc-400 font-medium">
            Laying out dependency graph...
          </span>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md select-none">
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

      {!isLoading && !isEmpty && (
        <ForceGraph2D<ForceGraphNode, ForceGraphLink>
          ref={forceGraphRef}
          width={forceSize.width}
          height={forceSize.height}
          graphData={forceGraphData}
          backgroundColor="#0f0f1a"
          nodeRelSize={1}
          linkCurvature={0.18}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.96}
          linkDirectionalArrowColor={(link) =>
            getForceLinkColor(
              link,
              selectedNodeId,
              blastRadiusActive,
              highlightedNodeIds,
              compareBranch,
            )
          }
          cooldownTicks={160}
          d3AlphaDecay={0.025}
          d3VelocityDecay={0.32}
          onEngineStop={() => {
            if (forceInitialViewDoneRef.current) return;
            forceInitialViewDoneRef.current = true;
            const fg = forceGraphRef.current;
            if (!fg) return;
            const nodeCount = forceGraphData.nodes.length;
            if (nodeCount <= 3) {
              const firstNode = forceGraphData.nodes[0];
              fg.centerAt(
                firstNode.x ?? 0,
                firstNode.y ?? 0,
                nodeCount <= 1 ? 1.0 : 1.5,
              );
            } else {
              fg.zoomToFit(650, 90);
            }
          }}
          linkDirectionalParticles={0}
          linkWidth={(link) => {
            const sourceId =
              typeof link.source === "string" ? link.source : link.source.id;
            const targetId =
              typeof link.target === "string" ? link.target : link.target.id;
            if (
              blastRadiusActive &&
              highlightedNodeIds.has(sourceId) &&
              highlightedNodeIds.has(targetId)
            )
              return 2.8;
            if (compareBranch) {
              const src =
                typeof link.source === "object"
                  ? link.source
                  : forceNodeById.get(sourceId);
              const tgt =
                typeof link.target === "object"
                  ? link.target
                  : forceNodeById.get(targetId);
              if (src?.diffStatus || tgt?.diffStatus) return 1.4;
            }
            return selectedNodeId &&
              (sourceId === selectedNodeId || targetId === selectedNodeId)
              ? 2.4
              : 0.9;
          }}
          linkColor={(link) =>
            getForceLinkColor(
              link,
              selectedNodeId,
              blastRadiusActive,
              highlightedNodeIds,
              compareBranch,
            )
          }
          nodePointerAreaPaint={(node, color, ctx) => {
            const radius = getForceNodeRadius(node) + 3;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
            ctx.fill();
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const isSelected = node.id === selectedNodeId;
            const isNeighbor = highlightedNodeIds.has(node.id);
            const isDimmed = selectedNodeId && !isSelected && !isNeighbor;
            const radius = getForceNodeRadius(node);
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const diffColor =
              compareBranch && node.diffStatus
                ? DIFF_STATUS_COLORS[node.diffStatus]
                : undefined;

            ctx.globalAlpha = isDimmed ? (blastRadiusActive ? 0.08 : 0.22) : 1;

            if (diffColor) {
              ctx.beginPath();
              ctx.arc(x, y, radius + 2.5, 0, Math.PI * 2);
              ctx.strokeStyle = diffColor;
              ctx.lineWidth = 2.5 / globalScale;
              ctx.globalAlpha = isDimmed ? 0.15 : 0.85;
              ctx.stroke();
              ctx.globalAlpha = isDimmed
                ? blastRadiusActive
                  ? 0.08
                  : 0.22
                : 1;
            }

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.shadowColor = isSelected ? node.color : "transparent";
            ctx.shadowBlur = isSelected ? 18 : 0;
            ctx.fill();
            ctx.shadowBlur = 0;

            if (isSelected || hoveredForceNode?.id === node.id) {
              ctx.beginPath();
              ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1.8 / globalScale;
              ctx.stroke();
            }

            if (
              isSelected ||
              hoveredForceNode?.id === node.id ||
              globalScale > 1.15
            ) {
              const fontSize = Math.max(10 / globalScale, 3.8);
              ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "rgba(245,245,255,0.92)";
              ctx.fillText(node.label, x, y + radius + 3 / globalScale);
            }

            ctx.globalAlpha = 1;
          }}
          onNodeClick={(node) => {
            if (!readOnly) focusForceNode(node);
          }}
          onNodeHover={(node) => {
            setHoveredForceNode(node ?? null);
            if (forceHostRef.current)
              forceHostRef.current.style.cursor = node ? "pointer" : "grab";
          }}
          onBackgroundClick={onForceBackgroundClick}
          enablePointerInteraction
          enableNodeDrag
          enablePanInteraction
          enableZoomInteraction
        />
      )}

      {!readOnly && !isEmpty && (
        <ExportMapPanel
          onExport={handleExport}
          isExporting={isExporting}
          exportFormat={exportFormat}
        />
      )}

      {/* Zoom Controls (bottom-left) */}
      {!readOnly && !isEmpty && (
        <GraphZoomControls
          onZoomIn={() => {
            const currentZoom = forceGraphRef.current?.zoom();
            if (typeof currentZoom === "number")
              forceGraphRef.current?.zoom(currentZoom * 1.3, 300);
          }}
          onZoomOut={() => {
            const currentZoom = forceGraphRef.current?.zoom();
            if (typeof currentZoom === "number")
              forceGraphRef.current?.zoom(currentZoom * 0.7, 300);
          }}
          onFitView={() => forceGraphRef.current?.zoomToFit(400, 60)}
        />
      )}

      {!readOnly && (
        <GraphSidebar
          fileTypeCounts={fileTypeCounts}
          stats={{
            nodes: forceGraphData.nodes.length,
            edges: forceGraphData.links.length,
            communities: communityCount,
          }}
          diffCounts={diffCounts}
          isEmpty={isEmpty}
          graphDiff={graphDiff}
          defaultBranch={defaultBranch}
          selectedNode={
            selectedForceNode
              ? {
                  id: selectedForceNode.id,
                  label: selectedForceNode.label,
                  fileType: selectedForceNode.fileType,
                  communityName: selectedForceNode.communityName,
                  degree: selectedForceNode.degree,
                  sourceFile: selectedForceNode.sourceFile,
                  color: selectedForceNode.color,
                }
              : null
          }
          neighbors={
            blastRadiusActive
              ? Array.from(highlightedNodeIds)
                  .filter((id) => id !== selectedNodeId)
                  .map((id) => forceNodeById.get(id))
                  .filter((n): n is ForceGraphNode => Boolean(n))
                  .map((n) => ({
                    id: n.id,
                    label: n.label,
                    fileType: n.fileType,
                    communityName: n.communityName,
                    degree: n.degree,
                    sourceFile: n.sourceFile,
                    color: n.color,
                  }))
              : selectedForceNeighbors.map((n) => ({
                  id: n.id,
                  label: n.label,
                  fileType: n.fileType,
                  communityName: n.communityName,
                  degree: n.degree,
                  sourceFile: n.sourceFile,
                  color: n.color,
                }))
          }
          onNodeClick={(node) => {
            const forceNode = forceNodeById.get(node.id);
            if (forceNode) focusForceNode(forceNode);
          }}
        />
      )}
    </div>
  );
}
