import { GitBranch, ShieldAlert } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface BottomStatusBarProps {
  analysis?: RepoAnalysis;
  treeTruncated?: boolean;
  showMinimap: boolean;
  activeView: 'graph' | 'architecture' | 'contributors' | 'commits';
}

export function BottomStatusBar({
  analysis,
  treeTruncated,
  showMinimap,
  activeView,
}: BottomStatusBarProps) {
  const selectedNodeId = useVizStore((state) => state.selectedNodeId);
  const focusedFilePath = useVizStore((state) => state.focusedFilePath);
  const selectedBranch = useVizStore((state) => state.selectedBranch);
  const zoom = useVizStore((state) => state.zoom);

  const nodeCount = analysis?.graph?.nodes?.length ?? 0;
  const edgeCount = analysis?.graph?.edges?.length ?? 0;
  const branchName = selectedBranch || analysis?.meta?.defaultBranch || 'main';

  // Passive zoom percentage calculation
  const zoomPct = activeView === 'graph' ? Math.round(zoom * 100) : 100;

  return (
    <footer className="relative z-40 flex h-8 shrink-0 items-center justify-between border-t border-white/[0.05] bg-zinc-950 px-4 text-[11px] text-zinc-500 select-none">
      {/* Left Group */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Branch chip */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <GitBranch className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="font-semibold text-zinc-300 font-mono">{branchName}</span>
        </div>

        <span className="text-zinc-800 font-light select-none">|</span>

        {/* Tree truncated warning */}
        {treeTruncated && (
          <>
            <div className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 font-sans uppercase">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span>Truncated</span>
            </div>
            <span className="text-zinc-800 font-light select-none">|</span>
          </>
        )}

        {/* Selection Status */}
        {selectedNodeId ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 px-1 py-0.5 rounded text-violet-400 shrink-0 font-sans">
              FOCUS
            </span>
            <span className="truncate font-mono text-zinc-400 text-xs max-w-[180px] sm:max-w-[320px] md:max-w-[480px] lg:max-w-[720px]" title={focusedFilePath || selectedNodeId}>
              {focusedFilePath || selectedNodeId}
            </span>
          </div>
        ) : (
          <span className="text-zinc-600 italic truncate font-sans text-xs">
            No element selected
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Group */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Graph Node/Edge Stats */}
        {nodeCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-xs">
            <span>{nodeCount} nodes</span>
            <span className="text-zinc-700 font-light">·</span>
            <span>{edgeCount} edges</span>
          </div>
        )}

        {activeView === 'graph' && (
          <>
            <span className="hidden sm:inline text-zinc-800 font-light select-none">|</span>
            
            {/* Minimap Status */}
            <div className="text-zinc-500 text-xs">
              <span>Minimap:</span>{' '}
              <span className={cn('font-semibold', showMinimap ? 'text-violet-400' : 'text-zinc-500')}>
                {showMinimap ? 'On' : 'Off'}
              </span>
            </div>

            <span className="text-zinc-800 font-light select-none">|</span>

            {/* Zoom Status */}
            <div className="text-zinc-400 font-mono text-xs font-semibold">
              {zoomPct}%
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
export default BottomStatusBar;
