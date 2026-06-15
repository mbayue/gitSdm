import {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  MiniMap,
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
} from "../nodes/GraphNodes";
import type { GraphData } from "@/types";
import { useVizStore } from "@/stores/vizStore";
import { NetworkCanvas } from "./ForceGraphCanvas";

import { useGraphExport } from "../useGraphExport";
import { ToolbarDropdowns } from "./ToolbarDropdowns";

// Subcomponents & Helpers
import { LegendPanel } from "./widgets/LegendPanel";
import { FloatingGraphControls } from "./widgets/FloatingGraphControls";
import { useGraphCanvasState } from "./hooks/useGraphCanvasState";
import { useGraphLayout } from "./hooks/useGraphLayout";
import { useGraphCentering } from "./hooks/useGraphCentering";

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
  showMinimap?: boolean;
  setShowMinimap?: (show: boolean) => void;
  hideChrome?: boolean;
}

export function GraphCanvas({
  graph,
  readOnly,
  showMinimap,
  setShowMinimap,
  hideChrome,
}: GraphCanvasProps) {
  const {
    setSelectedNodeId,
    setHighlightedNodeIds,
    setFocusedFilePath,
    toggleNodeTypeFilter,
    toggleDiffStatusFilter,
    setActiveFocusLayer,
    setBlastRadiusActive,
    setLayoutType,
    setActiveDropdown,
    selectedNodeId,
    highlightedNodeIds,
    focusedFilePath,
    layoutType,
    theme,
    activeFocusLayer,
    blastRadiusActive,
    nodeTypeFilters,
    compareBranch,
    diffStatusFilters,
    activeDropdown,
    legendOpen,
    setLegendOpen,
  } = useVizStore();

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as globalThis.Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveDropdown]);

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

  // --- Filtering & Helper states ---
  const {
    defaultEdgeOptions,
    filtered,
    connectedNodeIdsByNodeId,
  } = useGraphCanvasState(graph, readOnly);

  // --- Layout Hook ---
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    isCalculatingLayout,
  } = useGraphLayout({
    filtered,
    layoutType,
    theme,
    selectedNodeId,
    highlightedNodeIds,
    blastRadiusActive,
  });

  // --- View Centering / Zoom Hook ---
  useGraphCentering({
    nodes,
    layoutType,
    isCalculatingLayout,
    selectedNodeId,
    focusedFilePath,
    fitView,
    setCenter,
  });

  // --- Blast radius updates ---
  useEffect(() => {
    if (!selectedNodeId) {
      setHighlightedNodeIds(new Set());
      return;
    }
    setHighlightedNodeIds(
      new Set(
        connectedNodeIdsByNodeId.get(selectedNodeId) ?? [selectedNodeId]
      )
    );
  }, [selectedNodeId, connectedNodeIdsByNodeId, setHighlightedNodeIds]);

  // --- Event handlers ---
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (readOnly) return;

      setSelectedNodeId(node.id);
      if (node.type === "file" && node.data?.path) {
        setFocusedFilePath(node.data.path as string);
      } else {
        setFocusedFilePath(null);
      }

      window.setTimeout(() => {
        const width =
          typeof node.measured?.width === "number"
            ? node.measured.width
            : node.width ?? 0;
        const height =
          typeof node.measured?.height === "number"
            ? node.measured.height
            : node.height ?? 0;
        setCenter(node.position.x + width / 2, node.position.y + height / 2, {
          duration: 480,
          zoom: 1.3,
        });
      }, 50);
    },
    [readOnly, setCenter, setSelectedNodeId, setFocusedFilePath],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setHighlightedNodeIds(new Set());
    setFocusedFilePath(null);
  }, [setSelectedNodeId, setHighlightedNodeIds, setFocusedFilePath]);

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

  // --- Render states ---
  const isLoading = !graph || !graph.nodes || isCalculatingLayout;
  const isEmpty = filtered.nodes.length === 0;

  return (
    <div className="graph-canvas-host h-full w-full relative">
      {!hideChrome && (
        <>
          {/* Attached Main Graph Action Toolbar */}
          <div ref={toolbarRef} className="absolute top-0 left-0 z-30 flex h-10 items-center gap-1 border-r border-b border-white/[0.05] bg-zinc-950/85 px-3 rounded-br-xl shadow-md backdrop-blur-md select-none font-sans">
            <ToolbarDropdowns
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              nodeTypeFilters={nodeTypeFilters}
              toggleNodeTypeFilter={toggleNodeTypeFilter}
              compareBranch={!!compareBranch}
              diffStatusFilters={diffStatusFilters}
              toggleDiffStatusFilter={toggleDiffStatusFilter}
              activeFocusLayer={activeFocusLayer}
              setActiveFocusLayer={setActiveFocusLayer}
              blastRadiusActive={blastRadiusActive}
              setBlastRadiusActive={setBlastRadiusActive}
              layoutType={layoutType}
              setLayoutType={setLayoutType}
              handleExport={handleExport}
            />
          </div>

          {/* Legend Panel */}
          <LegendPanel legendOpen={legendOpen} setLegendOpen={setLegendOpen} />

          {/* Floating Graph Controls */}
          <FloatingGraphControls showMinimap={!!showMinimap} setShowMinimap={setShowMinimap || (() => {})} />
        </>
      )}

      {layoutType === "network" ? (
        <NetworkCanvas graph={filtered} readOnly={readOnly} showMinimap={showMinimap} />
      ) : (
        <>
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
            onMove={undefined}
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
            {showMinimap && (
              <MiniMap
                style={{
                  bottom: 68,
                  right: 16,
                  margin: 0,
                  background: isDark ? "rgba(9, 9, 11, 0.85)" : "rgba(255, 255, 255, 0.85)",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "8px",
                }}
                nodeColor={(node) => (node.data?.nodeColor as string) ?? "#8b5cf6"}
                zoomable
                pannable
              />
            )}
          </ReactFlow>
        </>
      )}
    </div>
  );
}
