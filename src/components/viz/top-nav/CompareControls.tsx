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
      <div role="group" aria-label="Branch mode" className="mb-2 flex gap-1 rounded-md bg-background p-1 border border-border">
        <button
          type="button"
          aria-pressed={mode === 'switch'}
          onClick={() => onModeChange('switch')}
          className={cn(
            'flex-1 rounded-sm py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer',
            mode === 'switch'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          Switch Branch
        </button>
        <button
          type="button"
          aria-pressed={mode === 'compare'}
          onClick={() => onModeChange('compare')}
          className={cn(
            'flex-1 rounded-sm py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer',
            mode === 'compare'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          Compare Mode
        </button>
      </div>

      {/* Compare sub-tabs: Branches / Tags / Commit SHA */}
      {mode === 'compare' && (
        <div role="group" aria-label="Compare reference type" className="mb-2 flex gap-1 rounded-md bg-background p-1 border border-border">
          {(['branch', 'tag', 'commit'] as CompareTab[]).map((tab) => {
            const Icon = tab === 'branch' ? GitBranch : tab === 'tag' ? Tag : GitCommit;
            const label = tab === 'branch' ? 'Branches' : tab === 'tag' ? 'Tags' : 'SHA';
            return (
              <button
                key={tab}
                type="button"
                aria-pressed={compareTab === tab}
                onClick={() => onCompareTabChange(tab)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-sm py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer',
                  compareTab === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
