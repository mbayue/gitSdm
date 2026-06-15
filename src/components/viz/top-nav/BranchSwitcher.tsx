import { useState, useRef, useEffect } from 'react';
import { useVizStore } from '@/stores/vizStore';
import { useRepoBranches } from '@/hooks/useRepoBranches';
import { GitBranch, ChevronDown, Search, Check, AlertCircle, ArrowLeftRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BranchSwitcherProps {
  owner: string;
  repo: string;
  defaultBranch: string;
}

export function BranchSwitcher({ owner, repo, defaultBranch }: BranchSwitcherProps) {
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
  const [mode, setMode] = useState<'switch' | 'compare'>('switch');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync available branches with store
  useEffect(() => {
    if (branches) {
      setAvailableBranches(branches.map((b) => b.name));
    }
  }, [branches, setAvailableBranches]);

  // Click outside listener
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

  // Grouping & Categorization
  const getGroupedBranches = () => {
    if (!branches) return { current: [], recent: [], feature: [], other: [] };

    const filtered = branches.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const active = activeBranch;
    const current = filtered.filter((b) => b.name === active);
    const rest = filtered.filter((b) => b.name !== active);

    const feature = rest.filter(
      (b) =>
        b.name.startsWith('feature/') ||
        b.name.startsWith('feat/') ||
        b.name.startsWith('refactor/') ||
        b.name.startsWith('fix/') ||
        b.name.startsWith('bug/')
    );

    const recent = rest.filter(
      (b) =>
        !feature.includes(b) &&
        ['main', 'master', 'develop', 'dev', 'production', 'prod'].includes(b.name)
    );

    const other = rest.filter((b) => !feature.includes(b) && !recent.includes(b));

    return { current, recent, feature, other };
  };

  const handleBranchSelect = (branchName: string) => {
    if (mode === 'switch') {
      setSelectedBranch(branchName);
      if (compareBranch === branchName) {
        setCompareBranch(null);
      }
    } else {
      if (compareBranch === branchName) {
        setCompareBranch(null);
      } else if (activeBranch === branchName) {
        return; // Cant compare same branch
      } else {
        setCompareBranch(branchName);
      }
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const { current, recent, feature, other } = getGroupedBranches();
  const hasResults = current.length > 0 || recent.length > 0 || feature.length > 0 || other.length > 0;

  return (
    <div className="relative z-50 min-w-0 max-w-full shrink font-sans" ref={containerRef}>
      {/* Trigger Button or Compare Pill */}
      {compareBranch ? (
        <div className="flex max-w-full min-w-0 items-center gap-0.5 sm:gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold py-0.5 pl-1.5 sm:pl-2.5 pr-1 rounded-full select-none shadow-sm transition-all duration-200 hover:border-amber-500/40">
          <button
            type="button"
            onClick={() => {
              setMode('compare');
              setIsOpen(!isOpen);
            }}
            className="flex min-w-0 items-center gap-0.5 sm:gap-1.5 cursor-pointer outline-none hover:text-amber-300"
          >
            <ArrowLeftRight className="h-3 w-3 shrink-0" />
            <span className="hidden lg:inline font-normal font-sans">Comparing:</span>
            <span className="font-mono bg-amber-500/15 px-1 sm:px-1.5 py-0.5 rounded truncate max-w-[34px] sm:max-w-[80px] lg:max-w-[120px]">{activeBranch}</span>
            <span className="text-amber-500/60 font-sans font-light">→</span>
            <span className="font-mono bg-amber-500/15 px-1 sm:px-1.5 py-0.5 rounded truncate max-w-[34px] sm:max-w-[80px] lg:max-w-[120px]">{compareBranch}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          <div className="hidden sm:block w-px h-3 bg-amber-500/25 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => setCompareBranch(null)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-amber-500/20 text-amber-500 hover:text-amber-200 transition-colors cursor-pointer"
            title="Exit Compare"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMode('switch');
            setIsOpen(!isOpen);
          }}
          className={cn(
             'flex min-w-0 items-center gap-1 rounded-full border border-white/[0.06] bg-zinc-900 px-2 sm:px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/[0.12] transition-all duration-200 select-none active:scale-[0.97] cursor-pointer'
          )}
        >
          <GitBranch className="h-3.5 w-3.5 text-violet-400" />
          <span className="max-w-[56px] sm:max-w-[140px] truncate font-mono">{activeBranch}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform duration-200 opacity-60', isOpen && 'rotate-180')} />
        </button>
      )}

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed left-2 right-2 top-14 z-[100] max-h-[calc(100dvh-4rem)] rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl backdrop-blur-xl sm:absolute sm:left-0 sm:right-auto sm:top-auto sm:mt-2 sm:w-[min(18rem,calc(100vw-1rem))]"
          >
            {/* Tabs */}
            <div className="mb-2 flex rounded-lg bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setMode('switch')}
                className={cn(
                  'flex-1 rounded-md py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer',
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
                  'flex-1 rounded-md py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer',
                  mode === 'compare'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm font-semibold'
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
                className="w-full rounded-lg border border-white/[0.04] bg-zinc-900/60 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors font-sans"
                autoFocus
              />
            </div>

            {/* Dropdown Options */}
            <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {isLoading && (
                <div className="flex items-center justify-center py-6 text-xs text-zinc-500 gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent text-violet-500" />
                  <span>Loading branches...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-1.5 justify-center py-6 text-xs text-red-400 px-2 text-center">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Failed to fetch branches.</span>
                </div>
              )}

              {!isLoading && !error && !hasResults && (
                <div className="py-6 text-center text-xs text-zinc-500">No branches found.</div>
              )}

              {!isLoading && !error && hasResults && (
                <div className="space-y-3">
                  {/* Category: Current */}
                  {current.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Current</div>
                      {current.map((b) => (
                        <BranchItem key={b.name} branch={b} isCurrent isCompared={compareBranch === b.name} mode={mode} onSelect={handleBranchSelect} />
                      ))}
                    </div>
                  )}

                  {/* Category: Recent */}
                  {recent.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Recent</div>
                      {recent.map((b) => (
                        <BranchItem key={b.name} branch={b} isCurrent={false} isCompared={compareBranch === b.name} mode={mode} onSelect={handleBranchSelect} />
                      ))}
                    </div>
                  )}

                  {/* Category: Feature */}
                  {feature.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Feature</div>
                      {feature.map((b) => (
                        <BranchItem key={b.name} branch={b} isCurrent={false} isCompared={compareBranch === b.name} mode={mode} onSelect={handleBranchSelect} />
                      ))}
                    </div>
                  )}

                  {/* Category: Other */}
                  {other.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Other</div>
                      {other.map((b) => (
                        <BranchItem key={b.name} branch={b} isCurrent={false} isCompared={compareBranch === b.name} mode={mode} onSelect={handleBranchSelect} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BranchItemProps {
  branch: { name: string; protected: boolean };
  isCurrent: boolean;
  isCompared: boolean;
  mode: 'switch' | 'compare';
  onSelect: (name: string) => void;
}

function BranchItem({ branch, isCurrent, isCompared, mode, onSelect }: BranchItemProps) {
  const isDisabled = mode === 'compare' && isCurrent;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(branch.name)}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-mono transition-all duration-150 cursor-pointer',
        isDisabled
          ? 'opacity-30 cursor-not-allowed text-zinc-650'
          : isCurrent && mode === 'switch'
            ? 'bg-violet-600/15 text-violet-400 font-semibold'
            : isCompared && mode === 'compare'
              ? 'bg-amber-500/15 text-amber-400 font-semibold'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
      )}
    >
      <span className="truncate pr-4">{branch.name}</span>
      {mode === 'switch' && isCurrent && <Check className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
      {mode === 'compare' && isCompared && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
    </button>
  );
}
