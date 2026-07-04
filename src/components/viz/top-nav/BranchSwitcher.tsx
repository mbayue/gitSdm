import { useState, useRef, useEffect } from 'react';
import { useVizStore } from '@/stores/vizStore';
import { useRepoBranches } from '@/hooks/useRepoBranches';
import { useRepoTags } from '@/hooks/useRepoTags';
import {
  GitBranch, Tag, GitCommit, ChevronDown, Search,
  ArrowLeftRight, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CompareTab } from './CompareControls';
import { CompareControls } from './CompareControls';
import { BranchSelector } from './BranchSelector';
import { TagSelector } from './TagSelector';
import { CommitShaInput } from './CommitShaInput';

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
    compareRefType,
    setCompareRefType,
    setAvailableBranches,
  } = useVizStore();

  const { data: branches, isLoading: branchesLoading, error: branchesError } = useRepoBranches(owner, repo);
  const { data: tags, isLoading: tagsLoading, error: tagsError } = useRepoTags(owner, repo);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'switch' | 'compare'>('switch');
  const [compareTab, setCompareTab] = useState<CompareTab>('branch');
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

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleBranchSelect = (branchName: string) => {
    if (mode === 'switch') {
      setSelectedBranch(branchName);
      if (compareBranch === branchName) setCompareBranch(null);
    } else {
      if (compareBranch === branchName && compareRefType === 'branch') {
        setCompareBranch(null);
      } else if (activeBranch === branchName) {
        return;
      } else {
        setCompareBranch(branchName);
        setCompareRefType('branch');
      }
    }
    handleClose();
  };

  const handleTagSelect = (tagName: string) => {
    if (compareBranch === tagName && compareRefType === 'tag') {
      setCompareBranch(null);
    } else {
      setCompareBranch(tagName);
      setCompareRefType('tag');
    }
    handleClose();
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
    handleClose();
    setShaInput('');
  };

  // ── Pill label helpers ──
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

  // Show search input for branch/tag modes only
  const showSearch = mode === 'switch' || (mode === 'compare' && compareTab !== 'commit');

  return (
    <div className="relative z-50 min-w-0 max-w-full shrink font-sans" ref={containerRef}>
      {/* Trigger: Compare Pill or Branch Button */}
      {compareBranch ? (
        <div className="flex max-w-full min-w-0 items-center gap-0.5 sm:gap-1 rounded-md border border-[#58a6ff]/20 bg-[#58a6ff]/5 text-[#58a6ff] text-xs py-0.5 pl-1.5 sm:pl-2.5 pr-0.5 select-none transition-colors hover:border-[#58a6ff]/40">
          <button
            type="button"
            onClick={() => { setMode('compare'); setCompareTab(compareRefType as CompareTab); setIsOpen(!isOpen); }}
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
          onClick={() => { setMode('switch'); setIsOpen(!isOpen); }}
          className="flex min-w-0 items-center gap-1.5 rounded-md px-2 sm:px-2.5 py-1 text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors select-none cursor-pointer"
        >
          <GitBranch className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="max-w-[56px] sm:max-w-[140px] truncate font-sans text-[#e6edf3]">{activeBranch}</span>
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
            className="fixed left-2 right-2 top-14 z-[100] max-h-[calc(100dvh-4rem)] rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1.5 shadow-2xl sm:absolute sm:left-0 sm:right-auto sm:top-auto sm:mt-2 sm:w-[min(18rem,calc(100vw-1rem))]"
          >
            <CompareControls
              mode={mode}
              compareTab={compareTab}
              onModeChange={(m) => { setMode(m); setSearchQuery(''); }}
              onCompareTabChange={(t) => { setCompareTab(t); setSearchQuery(''); setShaError(''); }}
            />

            {/* Search input — shown for switch mode and branch/tag compare tabs */}
            {showSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                <input
                  type="text"
                  placeholder={mode === 'switch' ? 'Filter branches...' : compareTab === 'tag' ? 'Filter tags...' : 'Select branch to compare...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-1.5 pl-8 pr-3 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-colors font-sans"
                  autoFocus
                />
              </div>
            )}

            {/* Content area */}
            <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {/* Switch mode or Compare mode Branches tab */}
              {(mode === 'switch' || (mode === 'compare' && compareTab === 'branch')) && (
                <BranchSelector
                  branches={branches}
                  branchesLoading={branchesLoading}
                  branchesError={branchesError}
                  searchQuery={searchQuery}
                  mode={mode}
                  compareBranch={compareBranch}
                  compareRefType={compareRefType}
                  activeBranch={activeBranch}
                  onSelect={handleBranchSelect}
                />
              )}

              {/* Compare mode — Tags tab */}
              {mode === 'compare' && compareTab === 'tag' && (
                <TagSelector
                  tags={tags}
                  tagsLoading={tagsLoading}
                  tagsError={tagsError}
                  searchQuery={searchQuery}
                  compareBranch={compareBranch}
                  compareRefType={compareRefType}
                  onSelect={handleTagSelect}
                />
              )}

              {/* Compare mode — Commit SHA tab */}
              {mode === 'compare' && compareTab === 'commit' && (
                <CommitShaInput
                  shaInput={shaInput}
                  shaError={shaError}
                  onShaInput={(v) => { setShaInput(v); setShaError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleShaConfirm(); }}
                  onConfirm={handleShaConfirm}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
