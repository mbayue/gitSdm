import { lazy, Suspense, useCallback, useState } from "react";
import {
  GitBranch,
  Move,
  Network,
} from "lucide-react";
import { demoGraph } from "@/features/graph/demoGraph";

/**
 * Homepage sample graph. The preview never writes to the shared viz store:
 * filtering is already bypassed by `readOnly`, presentation is pinned via
 * explicit canvas overrides, and rendered counts are reported through a
 * local callback — so mounting, unmounting, or refreshing the homepage
 * cannot leak demo values into the user's persisted workspace settings.
 */

const GraphCanvas = lazy(() =>
  import("@/features/graph/canvas/GraphCanvas").then((module) => ({
    default: module.GraphCanvas,
  })),
);

export function HomeGraphPreview() {
  const [previewNodeCount, setPreviewNodeCount] = useState(0);
  const [previewEdgeCount, setPreviewEdgeCount] = useState(0);

  const handleVisibleCounts = useCallback((nodes: number, edges: number) => {
    setPreviewNodeCount(nodes);
    setPreviewEdgeCount(edges);
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
            <GraphCanvas
              graph={demoGraph}
              readOnly
              hideChrome
              colorModeOverride="default"
              sizeModeOverride="default"
              layoutTypeOverride="tree"
              onVisibleCounts={handleVisibleCounts}
            />
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
          {previewNodeCount || demoGraph.nodes.length} nodes{" "}
          <span className="mx-2 text-border">/</span>{" "}
          {previewEdgeCount || demoGraph.edges.length}{" "}
          connections
        </span>
        <span className="flex items-center gap-2">
          <GitBranch className="h-3 w-3" /> Sample project
        </span>
      </div>
    </div>
  );
}
