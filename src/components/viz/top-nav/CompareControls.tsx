import { GitBranch, Tag, GitCommit } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CompareTab = 'branch' | 'tag' | 'commit';

interface CompareControlsProps {
  mode: 'switch' | 'compare';
  compareTab: CompareTab;
  onModeChange: (mode: 'switch' | 'compare') => void;
  onCompareTabChange: (tab: CompareTab) => void;
}

export function CompareControls({ mode, compareTab, onModeChange, onCompareTabChange }: CompareControlsProps) {
  return (
    <>
      {/* Switch / Compare mode tabs */}
      <div className="mb-2 flex rounded-md bg-[#0d1117] p-0.5 border border-[rgba(240,246,252,0.1)]">
        <button
          type="button"
          onClick={() => onModeChange('switch')}
          className={cn(
            'flex-1 rounded-sm py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer',
            mode === 'switch'
              ? 'bg-[#1c2128] text-[#e6edf3] shadow-sm'
              : 'text-[#8b949e] hover:text-[#e6edf3]'
          )}
        >
          Switch Branch
        </button>
        <button
          type="button"
          onClick={() => onModeChange('compare')}
          className={cn(
            'flex-1 rounded-sm py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer',
            mode === 'compare'
              ? 'bg-[#1c2128] text-[#58a6ff] shadow-sm'
              : 'text-[#8b949e] hover:text-[#e6edf3]'
          )}
        >
          Compare Mode
        </button>
      </div>

      {/* Compare sub-tabs: Branches / Tags / Commit SHA */}
      {mode === 'compare' && (
        <div className="mb-2 flex rounded-md bg-[#0d1117] p-0.5 border border-[rgba(240,246,252,0.1)]">
          {(['branch', 'tag', 'commit'] as CompareTab[]).map((tab) => {
            const Icon = tab === 'branch' ? GitBranch : tab === 'tag' ? Tag : GitCommit;
            const label = tab === 'branch' ? 'Branches' : tab === 'tag' ? 'Tags' : 'SHA';
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onCompareTabChange(tab)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-sm py-1 text-[10px] font-medium transition-all duration-150 cursor-pointer',
                  compareTab === tab
                    ? 'bg-[#1c2128] text-[#58a6ff] shadow-sm'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                )}
              >
                <Icon className="h-2.5 w-2.5" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
