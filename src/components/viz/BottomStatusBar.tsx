import { TooltipHint } from '@/components/ui/tooltip';
import { GitBranch } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface BottomStatusBarProps {
  analysis?: RepoAnalysis;
  showMinimap: boolean;
  activeView: 'graph' | 'architecture' | 'contributors' | 'commits';
}

export function BottomStatusBar({
  analysis,
  showMinimap,
  activeView,
}: BottomStatusBarProps) {
  const selectedNodeId = useVizStore((state) => state.selectedNodeId);
  const focusedFilePath = useVizStore((state) => state.focusedFilePath);
  const selectedBranch = useVizStore((state) => state.selectedBranch);
  const zoom = useVizStore((state) => state.zoom);
  const visibleNodeCount = useVizStore((state) => state.visibleNodeCount);
  const visibleEdgeCount = useVizStore((state) => state.visibleEdgeCount);

  const totalNodeCount = analysis?.graph?.nodes?.length ?? 0;
  const totalEdgeCount = analysis?.graph?.edges?.length ?? 0;
  const branchName = selectedBranch || analysis?.meta?.defaultBranch || 'main';

  // Passive zoom percentage calculation
  const zoomPct = activeView === 'graph' ? Math.round(zoom * 100) : 100;

  return (
    <footer className="workspace-status relative z-40 flex h-8 shrink-0 items-center justify-between border-t border-border bg-background px-4 text-xs text-muted-foreground select-none font-mono">
      {/* Left Group */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Branch chip */}
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
          <TooltipHint content={branchName}><span className="max-w-24 truncate font-medium text-foreground font-mono sm:max-w-40">{branchName}</span></TooltipHint>
        </div>

        <span className="text-border font-light select-none">|</span>


        {/* Selection Status */}
        {selectedNodeId || focusedFilePath ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 font-sans hidden sm:inline">
              SELECTED
            </span>
            <TooltipHint content={focusedFilePath || selectedNodeId || undefined}><span className="truncate font-mono text-foreground text-xs">
              {focusedFilePath || selectedNodeId}
            </span></TooltipHint>
          </div>
        ) : (
          <span className="text-muted-foreground italic truncate font-sans text-xs hidden sm:inline">
            {activeView === 'graph' ? 'Select a file or node to inspect' : activeView === 'architecture' ? 'Architecture' : activeView === 'contributors' ? 'Contributors' : 'Commit history'}
          </span>
        )}
      </div>

      {/* Right Group */}
      <div className="ml-3 flex items-center gap-3 shrink-0">
        {/* Graph Node/Edge Stats */}
        {activeView === 'graph' && totalNodeCount > 0 && (
          <div role="status" className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span>{visibleNodeCount} / {totalNodeCount} nodes</span>
            <span className="hidden sm:inline text-border font-light">·</span>
            <span className="hidden sm:inline">{visibleEdgeCount} / {totalEdgeCount} edges</span>
          </div>
        )}

        {activeView === 'graph' && (
          <>
            <span className="hidden sm:inline text-border font-light select-none">|</span>
            
            {/* Minimap Status */}
            <div className="hidden md:block text-muted-foreground text-xs">
              <span>Minimap:</span>{' '}
              <span className={cn('font-medium', showMinimap ? 'text-foreground' : 'text-muted-foreground')}>
                {showMinimap ? 'On' : 'Off'}
              </span>
            </div>

            <span className="hidden md:inline text-border font-light select-none">|</span>

            {/* Zoom Status */}
            <div className="text-foreground font-mono text-xs font-medium">
              {zoomPct}%
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
export default BottomStatusBar;
