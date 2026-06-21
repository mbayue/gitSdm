import {
  useEffect,
  useRef,
} from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

import type { GraphData } from "@/types";
import { useVizStore } from "@/stores/vizStore";
import { NetworkCanvas } from "./ForceGraphCanvas";

import { useGraphCanvasState } from "./hooks/useGraphCanvasState";
import { ToolbarDropdowns } from "./ToolbarDropdowns";
import { LegendPanel } from "./widgets/LegendPanel";
import { FloatingGraphControls } from "./widgets/FloatingGraphControls";
import { useGraphExport } from "../useGraphExport";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type { ForceGraphNode, ForceGraphLink } from "./force/forceGraphConstants";

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
    toggleNodeTypeFilter,
    toggleDiffStatusFilter,
    setActiveFocusLayer,
    setBlastRadiusActive,
    setActiveDropdown,
    activeFocusLayer,
    blastRadiusActive,
    nodeTypeFilters,
    compareBranch,
    diffStatusFilters,
    activeDropdown,
    legendOpen,
    setLegendOpen,
    graphScope,
    setGraphScope,
    contentFilters,
    toggleContentFilter,
    setVisibleCounts,
  } = useVizStore();

  const toolbarRef = useRef<HTMLDivElement>(null);
  const forceGraphRef = useRef<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>(undefined);
  const forceHostRef = useRef<HTMLDivElement | null>(null);
  const { owner = "", repo = "" } = useParams();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as globalThis.Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [setActiveDropdown]);



  // --- Filtering & Helper states ---
  const {
    filtered,
  } = useGraphCanvasState(graph, readOnly);

  const { isExporting, exportFormat, handleExport } = useGraphExport({
    mode: "force",
    forceGraphRef,
    forceHostRef,
    owner,
    repo,
    filenameSuffix: "graph",
  });

  const isCalculatingLayout = false; // Layout calculation is handled by ForceGraph

  // --- Render states ---
  const isLoading = !graph || !graph.nodes || isCalculatingLayout;
  const isEmpty = filtered.nodes.length === 0;

  return (
    <div className="graph-canvas-host h-full w-full relative">
      {!hideChrome && (
        <>
          {/* Attached Main Graph Action Toolbar */}
          <div ref={toolbarRef} className="absolute top-0 left-0 z-30 flex h-10 items-center gap-1 border-r border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-3 rounded-br-md select-none font-sans">
            <ToolbarDropdowns
              activeDropdown={activeDropdown as any}
              setActiveDropdown={setActiveDropdown as any}
              nodeTypeFilters={nodeTypeFilters}
              toggleNodeTypeFilter={toggleNodeTypeFilter}
              compareBranch={!!compareBranch}
              diffStatusFilters={diffStatusFilters}
              toggleDiffStatusFilter={toggleDiffStatusFilter}
              activeFocusLayer={activeFocusLayer}
              setActiveFocusLayer={setActiveFocusLayer}
              blastRadiusActive={blastRadiusActive}
              setBlastRadiusActive={setBlastRadiusActive}
              handleExport={handleExport}
              graphScope={graphScope}
              setGraphScope={setGraphScope}
              contentFilters={contentFilters}
              toggleContentFilter={toggleContentFilter}
            />
          </div>

          {/* Legend Panel */}
          <LegendPanel legendOpen={legendOpen} setLegendOpen={setLegendOpen} />

          {/* Floating Graph Controls */}
          <FloatingGraphControls showMinimap={!!showMinimap} setShowMinimap={setShowMinimap || (() => {})} />
        </>
      )}

      <>
        {isLoading && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm select-none">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ui-active-text-green border-t-transparent" />
            <span className="mt-3 text-xs text-zinc-400 font-medium">
              Laying out dependency graph...
            </span>
          </div>
        )}
        {isExporting && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md select-none">
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
        <NetworkCanvas 
          graph={filtered} 
          readOnly={readOnly} 
          showMinimap={showMinimap}
          forceGraphRef={forceGraphRef}
          forceHostRef={forceHostRef}
        />
      </>
    </div>
  );
}
