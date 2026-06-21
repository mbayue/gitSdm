import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { Loader2 } from "lucide-react";
import type { GraphEdge, GraphNode } from "@/types";
import { useForceCanvasState } from "./hooks/useForceCanvasState";
import { useVizStore } from "@/stores/vizStore";

import {
  type ForceGraphNode,
  type ForceGraphLink,
} from "../force/forceGraphConstants";
import { getForceLinkColor } from "../force/forceGraphUtils";

// Subcomponents & Helpers
import { drawForceNode, drawForcePointerArea } from "./force/forcePainter";
import { ForceMinimap } from "./force/ForceMinimap";

type NetworkGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

interface NetworkCanvasProps {
  graph: NetworkGraphData;
  readOnly?: boolean;
  showMinimap?: boolean;
}

export function NetworkCanvas({
  graph,
  readOnly,
  showMinimap,
}: NetworkCanvasProps) {
  const [tick, setTick] = useState(0);
  const theme = useVizStore((s) => s.theme);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const forceGraphRef = useRef<
    ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined
  >(undefined);
  const forceHostRef = useRef<HTMLDivElement | null>(null);
  const forceInitialViewDoneRef = useRef(false);
  const lastMinimapTickRef = useRef(0);

  const {
    selectedNodeId,
    setSelectedNodeId,
    highlightedNodeIds,
    setHighlightedNodeIds,
    setFocusedFilePath,
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
  } = useForceCanvasState({
    graph,
    forceGraphRef,
    forceHostRef,
    forceInitialViewDoneRef,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveDropdown]);

  // --- Callbacks ---
  const focusForceNode = useCallback(
    (node: ForceGraphNode) => {
      prevFocusRef.current = node.id; // prevent double centering sync
      setSelectedNodeId(node.id);
      setFocusedFilePath(
        node.nodeType === "file" && node.sourceFile ? node.sourceFile : null,
      );
      if (typeof node.x === "number" && typeof node.y === "number") {
        forceGraphRef.current?.centerAt(node.x, node.y, 300);
        forceGraphRef.current?.zoom(3.2, 300);
      }
    },
    [
      setFocusedFilePath,
      setSelectedNodeId,
      prevFocusRef,
    ],
  );

  const onForceBackgroundClick = useCallback(() => {
    prevFocusRef.current = null;
    setSelectedNodeId(null);
    setHighlightedNodeIds(new Set());
    setHoveredForceNode(null);
    setFocusedFilePath(null);
  }, [setHighlightedNodeIds, setSelectedNodeId, setFocusedFilePath, prevFocusRef, setHoveredForceNode]);

  const handleEngineTick = useCallback(() => {
    if (!showMinimap) return;

    const now = performance.now();
    if (now - lastMinimapTickRef.current < 140) return;

    lastMinimapTickRef.current = now;
    setTick((t) => t + 1);
  }, [showMinimap]);

  const handleEngineStop = useCallback(() => {
    if (showMinimap) setTick((t) => t + 1);
    forceInitialViewDoneRef.current = true;
  }, [showMinimap]);

  const getLinkWidth = useCallback((link: ForceGraphLink) => {
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
  }, [blastRadiusActive, compareBranch, forceNodeById, highlightedNodeIds, selectedNodeId]);

  const getLinkColor = useCallback((link: ForceGraphLink) =>
    getForceLinkColor(
      link,
      selectedNodeId,
      blastRadiusActive,
      highlightedNodeIds,
      compareBranch,
    ), [blastRadiusActive, compareBranch, highlightedNodeIds, selectedNodeId]);

  const drawNodePointerArea = useCallback((node: ForceGraphNode, color: string, ctx: CanvasRenderingContext2D) => {
    drawForcePointerArea(node, color, ctx);
  }, []);

  const drawNodeCanvasObject = useCallback((node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    drawForceNode({
      node,
      ctx,
      globalScale,
      selectedNodeId,
      highlightedNodeIds,
      blastRadiusActive,
      compareBranch: !!compareBranch,
      hoveredForceNode,
    });
  }, [blastRadiusActive, compareBranch, highlightedNodeIds, hoveredForceNode, selectedNodeId]);

  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    if (!readOnly) focusForceNode(node);
  }, [focusForceNode, readOnly]);

  const handleNodeHover = useCallback((node: ForceGraphNode | null) => {
    setHoveredForceNode(node ?? null);
    if (forceHostRef.current)
      forceHostRef.current.style.cursor = node ? "pointer" : "grab";
  }, [setHoveredForceNode]);

  // --- Render ---
  const isLoading = !graph || !graph.nodes;
  const isEmpty = graph.nodes.length === 0;

  return (
    <div
      className="graph-canvas-host h-full w-full relative"
      ref={forceHostRef}
    >
      {isLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm select-none">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ui-active-text-green border-t-transparent" />
          <span className="mt-3 text-xs text-zinc-400 font-medium">
            Laying out dependency graph...
          </span>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md select-none">
          <Loader2 className="h-8 w-8 animate-spin text-ui-active-text-green" />
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
          linkDirectionalArrowColor={getLinkColor}
          cooldownTicks={120}
          d3AlphaDecay={0.028}
          d3VelocityDecay={0.5}
          onEngineStop={handleEngineStop}
          linkDirectionalParticles={0}
          linkWidth={getLinkWidth}
          linkColor={getLinkColor}
          nodePointerAreaPaint={drawNodePointerArea}
          nodeCanvasObject={drawNodeCanvasObject}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={onForceBackgroundClick}
          onZoom={undefined}
          onEngineTick={handleEngineTick}
          enablePointerInteraction
          enableNodeDrag
          enablePanInteraction
          enableZoomInteraction
        />
      )}

      {showMinimap && !isLoading && !isEmpty && (
        <div
          className="absolute z-30 select-none pointer-events-none"
          style={{
            bottom: 68,
            right: 16,
            background: theme === "dark" ? "rgba(9, 9, 11, 0.85)" : "rgba(255, 255, 255, 0.85)",
            border: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <ForceMinimap
            nodes={forceGraphData.nodes}
            forceGraphRef={forceGraphRef}
            width={forceSize.width}
            height={forceSize.height}
            isDark={theme === "dark"}
            tick={tick}
          />
        </div>
      )}
    </div>
  );
}
