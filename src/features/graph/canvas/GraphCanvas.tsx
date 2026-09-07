import {
  useEffect,
  useRef,
} from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

import type { GraphData } from "@/types";
import { useVizStore, type ColorMode, type LayoutType, type SizeMode } from "@/stores/vizStore";
import { NetworkCanvas } from "./ForceGraphCanvas";

import { useGraphCanvasState } from "./hooks/useGraphCanvasState";
import { ToolbarDropdowns } from "./ToolbarDropdowns";
import { FloatingGraphControls } from "./widgets/FloatingGraphControls";
import { GraphFilterSummary } from "./widgets/GraphFilterSummary";
import { useGraphExport } from "../useGraphExport";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type { ForceGraphNode, ForceGraphLink } from "../force/forceGraphConstants";

interface GraphCanvasProps {
  graph: GraphData;
  readOnly?: boolean;
  showMinimap?: boolean;
  setShowMinimap?: (show: boolean) => void;
  hideChrome?: boolean;
  colorModeOverride?: ColorMode;
  sizeModeOverride?: SizeMode;
  layoutTypeOverride?: LayoutType;
  onVisibleCounts?: (nodes: number, edges: number) => void;
}

export function GraphCanvas({
  graph,
  readOnly,
  showMinimap,
  setShowMinimap,
  hideChrome,
  colorModeOverride,
  sizeModeOverride,
  layoutTypeOverride,
  onVisibleCounts,
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
    graphScope,
    setGraphScope,
    contentFilters,
    toggleContentFilter,
    colorMode: storedColorMode,
    setColorMode,
    sizeMode: storedSizeMode,
    setSizeMode,
    layoutType: storedLayoutType,
    setLayoutType,
    selectedNodeId,
    resetFilters,
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



  const colorMode = colorModeOverride ?? storedColorMode;
  const sizeMode = sizeModeOverride ?? storedSizeMode;
  const layoutType = layoutTypeOverride ?? storedLayoutType;

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
    <div className="graph-canvas-host flex h-full w-full flex-col relative">
      {!hideChrome && (
        <>
          {/* Attached Main Graph Action Toolbar */}
          <div ref={toolbarRef} role="group" aria-label="Graph controls"
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !activeDropdown) return;
              event.preventDefault();
              event.stopPropagation();
              toolbarRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus();
              setActiveDropdown(null);
            }}
            className="graph-toolbar relative z-30 flex shrink-0 flex-wrap items-center gap-1 border-b border-border bg-card px-2 py-1.5 select-none font-sans">
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
              handleExport={handleExport}
              exportDisabled={isEmpty || isExporting}
              graphScope={graphScope}
              setGraphScope={setGraphScope}
              contentFilters={contentFilters}
              toggleContentFilter={toggleContentFilter}
              colorMode={colorMode}
              setColorMode={setColorMode}
              sizeMode={sizeMode}
              setSizeMode={setSizeMode}
              layoutType={layoutType}
              setLayoutType={setLayoutType}
              nodeColors={Object.fromEntries(graph.nodes.filter((node) => node.type !== 'file' && node.data.nodeColor).map((node) => [node.type, node.data.nodeColor]))}
            />
          </div>
          <GraphFilterSummary
            selectionHidden={!!selectedNodeId && graph.nodes.some((node) => node.id === selectedNodeId) && !filtered.nodes.some((node) => node.id === selectedNodeId)} />

        </>
      )}

      <div className="relative min-h-0 flex-1">
        {!hideChrome && <FloatingGraphControls showMinimap={!!showMinimap} setShowMinimap={setShowMinimap || (() => {})} />}
        {isLoading && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background backdrop-blur-sm select-none">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ui-active-text-green border-t-transparent" />
            <span className="mt-3 text-xs text-muted-foreground font-medium">
              Laying out dependency graph...
            </span>
          </div>
        )}
        {isExporting && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-background backdrop-blur-md select-none">
            <Loader2 className="h-8 w-8 animate-spin text-ui-active-text-green" />
            <span className="mt-3 text-xs text-muted-foreground font-medium font-mono">
              Generating high-res {exportFormat?.toUpperCase()}...
            </span>
          </div>
        )}
        {!isLoading && isEmpty && (
          <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-background">
            <div className="mx-4 rounded-xl border border-border bg-card px-6 py-5 text-center backdrop-blur-md select-none">
              <div className="text-sm font-semibold text-foreground">
                No nodes match current filters
              </div>
              <div className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                Open Filter above to adjust node types, scope, or comparison status.
              </div>
              <button type="button" onClick={resetFilters} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-ui-primary-hover">Reset filters</button>
            </div>
          </div>
        )}
        <NetworkCanvas
          graph={filtered}
          readOnly={readOnly}
          showMinimap={showMinimap}
          forceGraphRef={forceGraphRef}
          forceHostRef={forceHostRef}
          colorModeOverride={colorModeOverride}
          sizeModeOverride={sizeModeOverride}
          layoutTypeOverride={layoutTypeOverride}
          onVisibleCounts={onVisibleCounts}
        />
      </div>
    </div>
  );
}
