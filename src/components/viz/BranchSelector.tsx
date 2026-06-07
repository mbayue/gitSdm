import { useState, useRef, useEffect } from 'react';
import { useVizStore } from '@/stores/viz-store';
import { useRepoBranches } from '@/hooks/useRepoBranches';
import { GitBranch, ChevronDown, Search, Check, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BranchSelectorProps {
  owner: string;
  repo: string;
  defaultBranch: string;
}

export function BranchSelector({ owner, repo, defaultBranch }: BranchSelectorProps) {
  const {
    selectedBranch,
    setSelectedBranch,
    compareBranch,
    setCompareBranch,
    setAvailableBranches,
  } = useVizStore();

  const { data: branches, isLoading, error } = useRepoBranches(owner, repo);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'switch' | 'compare'>('switch'); // 'switch' or 'compare'
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync available branches with the store
  useEffect(() => {
    if (branches) {
      setAvailableBranches(branches.map((b) => b.name));
    }
  }, [branches, setAvailableBranches]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeBranch = selectedBranch || defaultBranch;

  const filteredBranches = (branches || []).filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBranchSelect = (branchName: string) => {
    if (mode === 'switch') {
      setSelectedBranch(branchName);
      // Automatically clear compare branch if it's the same
      if (compareBranch === branchName) {
        setCompareBranch(null);
      }
    } else {
      // Toggle compare branch
      if (compareBranch === branchName) {
        setCompareBranch(null);
      } else if (activeBranch === branchName) {
        // Can't compare branch with itself
        return;
      } else {
        setCompareBranch(branchName);
      }
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative z-50 min-w-0 font-sans" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex max-w-[min(18rem,calc(100vw-10rem))] items-center gap-1.5 rounded-full border border-zinc-300/30 bg-zinc-900/40 px-3 py-1 text-xs font-medium backdrop-blur-md transition-all duration-200 select-none active:scale-[0.97]',
          compareBranch
            ? 'text-amber-500 border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)] bg-amber-500/5'
            : 'text-zinc-300 hover:text-zinc-100 hover:border-violet-500/40 hover:shadow-[0_0_10px_rgba(139,92,246,0.15)]'
        )}
      >
        <GitBranch className="h-3.5 w-3.5" />
        <span className="hidden sm:block max-w-[120px] truncate">{activeBranch}</span>
        {compareBranch && (
          <>
            <ArrowLeftRight className="h-3 w-3 text-amber-500/70" />
            <span className="hidden sm:block max-w-[120px] truncate text-amber-400 font-semibold">{compareBranch}</span>
          </>
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-200 opacity-60', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed left-2 right-2 top-14 w-auto sm:absolute sm:left-0 sm:right-auto sm:top-auto sm:mt-2 sm:w-72 max-w-[calc(100vw-1rem)] sm:max-w-none z-[100] rounded-xl border border-zinc-800/40 bg-zinc-950 p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          >
            {/* Mode Switcher Tabs */}
            <div className="mb-2.5 flex rounded-lg bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setMode('switch')}
                className={cn(
                  'min-w-0 flex-1 rounded-md py-1 text-[11px] font-medium transition-all duration-150',
                  mode === 'switch'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Switch Branch
              </button>
              <button
                type="button"
                onClick={() => setMode('compare')}
                className={cn(
                  'min-w-0 flex-1 rounded-md py-1 text-[11px] font-medium transition-all duration-150',
                  mode === 'compare'
                    ? 'bg-zinc-800 text-amber-500 dark:text-amber-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Compare Mode
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder={mode === 'switch' ? 'Filter branches...' : 'Select branch to compare...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-800/30 bg-zinc-900/60 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Dropdown Options */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              {isLoading && (
                <div className="flex items-center justify-center py-6 text-xs text-zinc-400 gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  Loading branches...
                </div>
              )}

              {error && (
                <div className="flex items-center gap-1.5 justify-center py-6 text-xs text-red-400 px-2 text-center">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Failed to fetch branches.
                </div>
              )}

              {!isLoading && !error && filteredBranches.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-450">No branches found.</div>
              )}

              {!isLoading &&
                !error &&
                filteredBranches.map((b) => {
                  const isCurrent = activeBranch === b.name;
                  const isCompared = compareBranch === b.name;
                  const isDisabled = mode === 'compare' && isCurrent;

                  return (
                    <button
                      key={b.name}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleBranchSelect(b.name)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-mono transition-all duration-150',
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed text-zinc-500'
                          : isCurrent && mode === 'switch'
                            ? 'bg-violet-500/10 text-violet-500 dark:text-violet-400 font-semibold'
                            : isCompared && mode === 'compare'
                              ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 font-semibold'
                              : 'text-zinc-300 hover:bg-zinc-900/80 hover:text-zinc-100'
                      )}
                    >
                      <span className="truncate pr-4">{b.name}</span>
                      {mode === 'switch' && isCurrent && <Check className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                      {mode === 'compare' && isCompared && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
            </div>

            {/* Compare Status Quick Reset */}
            {mode === 'compare' && compareBranch && (
              <div className="mt-2 pt-2 border-t border-zinc-800/30">
                <button
                  type="button"
                  onClick={() => {
                    setCompareBranch(null);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-lg py-1.5 text-center text-[11px] font-medium text-amber-500 hover:bg-amber-500/5 transition-all duration-150 border border-amber-500/25"
                >
                  Clear Comparison
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
