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
    <footer className="relative z-40 flex h-7 shrink-0 items-center justify-between border-t border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-4 text-[10px] text-[#8b949e] select-none font-mono">
      {/* Left Group */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Branch chip */}
        <div className="flex items-center gap-1.5 text-[#8b949e]">
          <GitBranch className="h-3 w-3 text-[#8b949e] shrink-0" />
          <span className="font-medium text-[#e6edf3] font-mono">{branchName}</span>
        </div>

        <span className="text-[#30363d] font-light select-none">|</span>


        {/* Selection Status */}
        {selectedNodeId ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b949e] shrink-0 font-sans hidden sm:inline">
              SELECTED
            </span>
            <span className="truncate font-mono text-[#e6edf3] text-[10px] max-w-[180px] sm:max-w-[320px] md:max-w-[480px] lg:max-w-[720px]" title={focusedFilePath || selectedNodeId}>
              {focusedFilePath || selectedNodeId}
            </span>
          </div>
        ) : (
          <span className="text-[#8b949e] italic truncate font-sans text-[10px] hidden sm:inline">
            No element selected
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Group */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Graph Node/Edge Stats */}
        {totalNodeCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[#8b949e] text-[10px]">
            <span>{visibleNodeCount} / {totalNodeCount} nodes</span>
            <span className="text-[#30363d] font-light">·</span>
            <span>{visibleEdgeCount} / {totalEdgeCount} edges</span>
          </div>
        )}

        {activeView === 'graph' && (
          <>
            <span className="hidden sm:inline text-[#30363d] font-light select-none">|</span>
            
            {/* Minimap Status */}
            <div className="text-[#8b949e] text-[10px]">
              <span>Minimap:</span>{' '}
              <span className={cn('font-medium', showMinimap ? 'text-[#e6edf3]' : 'text-[#8b949e]')}>
                {showMinimap ? 'On' : 'Off'}
              </span>
            </div>

            <span className="text-[#30363d] font-light select-none">|</span>

            {/* Zoom Status */}
            <div className="text-[#e6edf3] font-mono text-[10px] font-medium">
              {zoomPct}%
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
export default BottomStatusBar;
