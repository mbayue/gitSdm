import { useState } from 'react';
import { ArrowLeft, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBranchPanelProps {
  activeSubPanel: 'branch-switch' | 'branch-compare';
  onBack: () => void;
  branches: { name: string; protected: boolean }[] | undefined;
  isLoading: boolean;
  activeBranch: string;
  compareBranch: string | null;
  onBranchSelect: (name: string) => void;
  onClose: () => void;
}

export function MobileBranchPanel({
  activeSubPanel,
  onBack,
  branches,
  isLoading,
  activeBranch,
  compareBranch,
  onBranchSelect,
  onClose,
}: MobileBranchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (name: string) => {
    onBranchSelect(name);
    onClose();
  };

  return (
    <div className="flex flex-col max-h-[300px]">
      {/* Sub-panel Header */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1.5 mb-1.5 px-1 select-none">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to actions menu"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" />
        </button>
        <span className="text-xs font-semibold text-foreground">
          {activeSubPanel === 'branch-switch' ? 'Switch Branch' : 'Compare Branch'}
        </span>
      </div>

      {/* Search branch */}
      <div className="relative px-1 mb-1.5 shrink-0">
        <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a branch..."
          aria-label="Find a branch"
          className="h-7 w-full rounded border border-border bg-background pl-7 pr-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
        />
      </div>

      {/* Scrollable list of branches */}
      <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[220px] pr-0.5 custom-scrollbar">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Loading branches...</div>
        ) : branches && branches.length > 0 ? (
          (() => {
            const filteredBranches = branches.filter((b) =>
              b.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredBranches.length === 0) {
              return <div className="py-4 text-center text-xs text-muted-foreground">No branches found</div>;
            }

            return filteredBranches.map((b) => {
              const isSwitchMode = activeSubPanel === 'branch-switch';
              const isSelected = isSwitchMode
                ? b.name === activeBranch
                : b.name === compareBranch;

              const isDisabled = !isSwitchMode && b.name === activeBranch;

              return (
                <button
                  type="button"
                  key={b.name}
                  disabled={isDisabled}
                  onClick={() => handleSelect(b.name)}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors",
                    isDisabled
                      ? "opacity-40 cursor-not-allowed text-muted-foreground"
                      : "hover:bg-secondary text-foreground",
                    isSelected && "bg-popover font-medium"
                  )}
                >
                  <span className="truncate pr-2">{b.name}</span>
                  {isSelected && <Check className="h-3 w-3 text-foreground shrink-0" />}
                </button>
              );
            });
          })()
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">No branches available</div>
        )}
      </div>
    </div>
  );
}
