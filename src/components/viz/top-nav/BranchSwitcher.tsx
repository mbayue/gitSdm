import { useState, useRef, useEffect } from 'react';
import { useVizStore } from '@/stores/vizStore';
import { useRepoBranches } from '@/hooks/useRepoBranches';
import { useRepoTags } from '@/hooks/useRepoTags';
import {
  GitBranch, Tag, GitCommit, ChevronDown, Search,
  Check, AlertCircle, ArrowLeftRight, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BranchSwitcherProps {
  owner: string;
  repo: string;
  defaultBranch: string;
}

type CompareTab = 'branch' | 'tag' | 'commit';

export function BranchSwitcher({ owner, repo, defaultBranch }: BranchSwitcherProps) {
  const {
    selectedBranch,
    setSelectedBranch,
    compareBranch,
    setCompareBranch,
    compareRefType,
    setCompareRefType,
    setAvailableBranches,
  } = useVizStore();

  const { data: branches, isLoading: branchesLoading, error: branchesError } = useRepoBranches(owner, repo);
  const { data: tags, isLoading: tagsLoading, error: tagsError } = useRepoTags(owner, repo);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'switch' | 'compare'>('switch');
  // Sub-tab inside compare mode
  const [compareTab, setCompareTab] = useState<CompareTab>('branch');
  // SHA input state
  const [shaInput, setShaInput] = useState('');
  const [shaError, setShaError] = useState('');

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

  // ── Branch grouping ────────────────────────────────────────────────
  const getGroupedBranches = () => {
    if (!branches) return { current: [], recent: [], feature: [], other: [] };

    const filtered = branches.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const current = filtered.filter((b) => b.name === activeBranch);
    const rest = filtered.filter((b) => b.name !== activeBranch);

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

  // ── Handlers ───────────────────────────────────────────────────────
  const handleBranchSelect = (branchName: string) => {
    if (mode === 'switch') {
      setSelectedBranch(branchName);
      if (compareBranch === branchName) setCompareBranch(null);
    } else {
      if (compareBranch === branchName) {
        setCompareBranch(null);
      } else if (activeBranch === branchName) {
        return; // can't compare same branch
      } else {
        setCompareBranch(branchName);
        setCompareRefType('branch');
      }
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleTagSelect = (tagName: string) => {
    if (compareBranch === tagName) {
      setCompareBranch(null);
    } else {
      setCompareBranch(tagName);
      setCompareRefType('tag');
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleShaConfirm = () => {
    const sha = shaInput.trim();
    if (!/^[0-9a-f]{7,40}$/i.test(sha)) {
      setShaError('Enter a valid SHA (7–40 hex characters)');
      return;
    }
    setShaError('');
    setCompareBranch(sha);
    setCompareRefType('commit');
    setIsOpen(false);
    setShaInput('');
  };

  // ── Pill label helpers ─────────────────────────────────────────────
  const compareLabel = (() => {
    if (!compareBranch) return null;
    if (compareRefType === 'commit') return compareBranch.slice(0, 7);
    return compareBranch;
  })();

  const CompareIcon = compareRefType === 'tag'
    ? Tag
    : compareRefType === 'commit'
      ? GitCommit
      : GitBranch;

  // ── Render ─────────────────────────────────────────────────────────
  const { current, recent, feature, other } = getGroupedBranches();
  const hasBranchResults = current.length > 0 || recent.length > 0 || feature.length > 0 || other.length > 0;

  const filteredTags = (tags ?? []).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative z-50 min-w-0 max-w-full shrink font-sans" ref={containerRef}>
      {/* ── Trigger: Compare Pill or Branch Button ── */}
      {compareBranch ? (
        <div className="flex max-w-full min-w-0 items-center gap-0.5 sm:gap-1 rounded-md border border-[#58a6ff]/20 bg-[#58a6ff]/5 text-[#58a6ff] text-xs py-0.5 pl-1.5 sm:pl-2.5 pr-0.5 select-none transition-colors hover:border-[#58a6ff]/40">
          <button
            type="button"
            onClick={() => {
              setMode('compare');
              setCompareTab(compareRefType as CompareTab);
              setIsOpen(!isOpen);
            }}
            className="flex min-w-0 items-center gap-0.5 sm:gap-1.5 cursor-pointer outline-none hover:text-[#79c0ff] transition-colors"
          >
            <ArrowLeftRight className="h-3 w-3 shrink-0" />
            <span className="hidden lg:inline font-sans">Comparing:</span>
            <span className="font-mono text-[#e6edf3] truncate max-w-[34px] sm:max-w-[80px] lg:max-w-[120px]">{activeBranch}</span>
            <span className="text-[#58a6ff]/60 font-sans font-light">→</span>
            <CompareIcon className="h-3 w-3 shrink-0 opacity-70" />
            <span className="font-mono text-[#e6edf3] truncate max-w-[34px] sm:max-w-[80px] lg:max-w-[120px]">{compareLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          <div className="hidden sm:block w-px h-3.5 bg-[#58a6ff]/30 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => setCompareBranch(null)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-[#58a6ff]/20 text-[#58a6ff]/70 hover:text-[#79c0ff] transition-colors cursor-pointer"
            title="Exit Compare"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          title={activeBranch}
          onClick={() => {
            setMode('switch');
            setIsOpen(!isOpen);
          }}
          className="flex min-w-0 items-center gap-1.5 rounded-md px-2 sm:px-2.5 py-1 text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors select-none cursor-pointer"
        >
          <GitBranch className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="max-w-[56px] sm:max-w-[140px] truncate font-sans text-[#e6edf3]">{activeBranch}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform duration-200 opacity-60', isOpen && 'rotate-180')} />
        </button>
      )}

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed left-2 right-2 top-14 z-[100] max-h-[calc(100dvh-4rem)] rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1.5 shadow-2xl sm:absolute sm:left-0 sm:right-auto sm:top-auto sm:mt-2 sm:w-[min(18rem,calc(100vw-1rem))]"
          >
            {/* Switch / Compare mode tabs */}
            <div className="mb-2 flex rounded-md bg-[#0d1117] p-0.5 border border-[rgba(240,246,252,0.1)]">
              <button
                type="button"
                onClick={() => setMode('switch')}
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
                onClick={() => setMode('compare')}
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
                      onClick={() => { setCompareTab(tab); setSearchQuery(''); setShaError(''); }}
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

            {/* Search input — shown for switch mode and branch/tag compare tabs */}
            {(mode === 'switch' || (mode === 'compare' && compareTab !== 'commit')) && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                <input
                  type="text"
                  placeholder={
                    mode === 'switch'
                      ? 'Filter branches...'
                      : compareTab === 'tag'
                        ? 'Filter tags...'
                        : 'Select branch to compare...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-1.5 pl-8 pr-3 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-colors font-sans"
                  autoFocus
                />
              </div>
            )}

            {/* ── Content area ── */}
            <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-1">

              {/* Switch mode: branch list */}
              {mode === 'switch' && (
                <>
                  {branchesLoading && <LoadingRow label="Loading branches..." />}
                  {branchesError && <ErrorRow label="Failed to fetch branches." />}
                  {!branchesLoading && !branchesError && !hasBranchResults && (
                    <EmptyRow label="No branches found." />
                  )}
                  {!branchesLoading && !branchesError && hasBranchResults && (
                    <div className="space-y-3">
                      {current.length > 0 && (
                        <BranchGroup label="Current" items={current} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                      {recent.length > 0 && (
                        <BranchGroup label="Recent" items={recent} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                      {feature.length > 0 && (
                        <BranchGroup label="Feature" items={feature} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                      {other.length > 0 && (
                        <BranchGroup label="Other" items={other} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Compare mode — Branches tab */}
              {mode === 'compare' && compareTab === 'branch' && (
                <>
                  {branchesLoading && <LoadingRow label="Loading branches..." />}
                  {branchesError && <ErrorRow label="Failed to fetch branches." />}
                  {!branchesLoading && !branchesError && !hasBranchResults && (
                    <EmptyRow label="No branches found." />
                  )}
                  {!branchesLoading && !branchesError && hasBranchResults && (
                    <div className="space-y-3">
                      {current.length > 0 && (
                        <BranchGroup label="Current" items={current} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                      {recent.length > 0 && (
                        <BranchGroup label="Recent" items={recent} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                      {feature.length > 0 && (
                        <BranchGroup label="Feature" items={feature} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                      {other.length > 0 && (
                        <BranchGroup label="Other" items={other} compareBranch={compareBranch} mode={mode} onSelect={handleBranchSelect} activeBranch={activeBranch} />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Compare mode — Tags tab */}
              {mode === 'compare' && compareTab === 'tag' && (
                <>
                  {tagsLoading && <LoadingRow label="Loading tags..." />}
                  {tagsError && <ErrorRow label="Failed to fetch tags." />}
                  {!tagsLoading && !tagsError && filteredTags.length === 0 && (
                    <EmptyRow label="No tags found." />
                  )}
                  {!tagsLoading && !tagsError && filteredTags.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">Tags</div>
                      {filteredTags.map((t) => (
                        <RefItem
                          key={t.name}
                          name={t.name}
                          isCompared={compareBranch === t.name && compareRefType === 'tag'}
                          onSelect={() => handleTagSelect(t.name)}
                          icon={<Tag className="h-3 w-3 text-[#8b949e] shrink-0" />}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Compare mode — Commit SHA tab */}
              {mode === 'compare' && compareTab === 'commit' && (
                <div className="px-1 py-1 space-y-2">
                  <p className="text-[10px] text-[#8b949e] px-1">
                    Enter a full or short commit SHA (7–40 hex chars) to compare the current branch against a specific commit.
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. abc1234 or full SHA"
                      value={shaInput}
                      onChange={(e) => { setShaInput(e.target.value); setShaError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleShaConfirm(); }}
                      className="flex-1 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-1.5 px-2.5 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-colors font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleShaConfirm}
                      className="rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/20 px-2.5 py-1.5 text-[11px] font-medium text-[#58a6ff] hover:bg-[#58a6ff]/20 transition-colors cursor-pointer shrink-0"
                    >
                      Compare
                    </button>
                  </div>
                  {shaError && (
                    <p className="text-[10px] text-red-400 px-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {shaError}
                    </p>
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

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-xs text-zinc-500 gap-2">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent text-[#e6edf3]" />
      <span>{label}</span>
    </div>
  );
}

function ErrorRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-center py-6 text-xs text-red-400 px-2 text-center">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div className="py-6 text-center text-xs text-zinc-500">{label}</div>;
}

interface BranchGroupProps {
  label: string;
  items: { name: string; protected: boolean }[];
  compareBranch: string | null;
  mode: 'switch' | 'compare';
  activeBranch: string;
  onSelect: (name: string) => void;
}

function BranchGroup({ label, items, compareBranch, mode, activeBranch, onSelect }: BranchGroupProps) {
  return (
    <div>
      <div className="px-2 pb-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">{label}</div>
      {items.map((b) => (
        <BranchItem
          key={b.name}
          branch={b}
          isCurrent={b.name === activeBranch}
          isCompared={compareBranch === b.name}
          mode={mode}
          onSelect={onSelect}
        />
      ))}
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
        'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs font-mono transition-colors cursor-pointer',
        isDisabled
          ? 'opacity-30 cursor-not-allowed text-[#8b949e]'
          : isCurrent && mode === 'switch'
            ? 'bg-[#1c2128] text-[#e6edf3] font-medium'
            : isCompared && mode === 'compare'
              ? 'bg-[#1c2128] text-[#58a6ff] font-medium'
              : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]'
      )}
    >
      <span className="truncate pr-4">{branch.name}</span>
      {mode === 'switch' && isCurrent && <Check className="h-3.5 w-3.5 text-[#e6edf3] shrink-0" />}
      {mode === 'compare' && isCompared && <Check className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />}
    </button>
  );
}

interface RefItemProps {
  name: string;
  isCompared: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}

function RefItem({ name, isCompared, onSelect, icon }: RefItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-mono transition-colors cursor-pointer',
        isCompared
          ? 'bg-[#1c2128] text-[#58a6ff] font-medium'
          : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]'
      )}
    >
      {icon}
      <span className="truncate flex-1">{name}</span>
      {isCompared && <Check className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />}
    </button>
  );
}
