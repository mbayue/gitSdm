import { lazy, Suspense, useEffect } from "react";
import {
  GitBranch,
  Move,
  Network,
} from "lucide-react";
import { demoGraph } from "@/features/graph/demoGraph";
import { useVizStore } from "@/stores/vizStore";
import type { NodeType } from "@/types";

const GraphCanvas = lazy(() =>
  import("@/features/graph/canvas/GraphCanvas").then((module) => ({
    default: module.GraphCanvas,
  })),
);

/**
 * Presentation slices of the shared viz store that would otherwise leak a
 * repo-workspace session (filters, scope, layout, overlays) into the
 * homepage sample graph. While the preview is mounted these are pinned to
 * neutral demo values and restored on unmount, so the sample always renders
 * consistently no matter what the user toggled elsewhere.
 */
const DEMO_NODE_TYPES: NodeType[] = ["repo", "package", "folder", "file"];

export function HomeGraphPreview() {
  const visibleNodeCount = useVizStore((s) => s.visibleNodeCount);
  const visibleEdgeCount = useVizStore((s) => s.visibleEdgeCount);

  useEffect(() => {
    const store = useVizStore.getState();
    const snapshot = {
      nodeTypeFilters: store.nodeTypeFilters,
      fileTypeFilters: store.fileTypeFilters,
      graphScope: store.graphScope,
      contentFilters: store.contentFilters,
      colorMode: store.colorMode,
      sizeMode: store.sizeMode,
      layoutType: store.layoutType,
    };
    // Neutral demo presentation: everything visible, default styling/layout.
    store.setGraphScope("full");
    useVizStore.setState({
      nodeTypeFilters: new Set<NodeType>(DEMO_NODE_TYPES),
      fileTypeFilters: new Set<string>(),
      colorMode: "default",
      sizeMode: "default",
      layoutType: "tree",
    });
    // Reset rendered counts so the footer falls back to demo totals until
    // the preview reports its own (it renders the full demo by construction).
    store.setVisibleCounts(0, 0);
    return () => {
      useVizStore.setState(snapshot);
    };
  }, []);
  return (
    <div id="workspace-preview" className="preview-frame scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3 text-sm">
          <Network className="h-4 w-4 text-accent" />
          <span className="font-medium">Interactive dependency map</span>
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Sample project
          </span>
        </div>
        <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="status-dot" /> DEPENDENCY MAP
        </span>
      </div>
      <div className="flex h-[360px] min-h-[320px] flex-1">
        <div className="relative min-w-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading sample graph…
              </div>
            }
          >
            <GraphCanvas graph={demoGraph} readOnly hideChrome />
          </Suspense>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground">
            <Move className="h-3 w-3" /> Drag to explore · Scroll to zoom
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 font-mono text-xs text-muted-foreground">
        <span>
          {/* Rendered counts when the preview has reported them, demo totals
              otherwise — the footer always agrees with what is drawn. */}
          {visibleNodeCount || demoGraph.nodes.length} nodes{" "}
          <span className="mx-2 text-border">/</span>{" "}
          {visibleEdgeCount || demoGraph.edges.length}{" "}
          connections
        </span>
        <span className="flex items-center gap-2">
          <GitBranch className="h-3 w-3" /> Sample project
        </span>
      </div>
    </div>
  );
}
