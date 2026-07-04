import { useEffect, useRef, useState } from 'react';

import {
  Search,
  Share2,
  Check,
  MoreHorizontal,
  Settings,
  PanelLeft,
  PanelRight,
  GitBranch,
  ArrowLeftRight,
} from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import { SettingsPopover } from '../SettingsPopover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatStars } from '@/lib/utils';
import type { RepoMeta, RepoAnalysis } from '@/types';
import { cn } from '@/lib/utils';
import { getTotalCommits } from './getRepoStats';
import { useRepoBranches } from '@/hooks/useRepoBranches';
import { copyToClipboard } from '@/lib/clipboard';
import { ViewModeActions } from './ViewModeActions';
import { MobileBranchPanel } from './MobileBranchPanel';

interface HeaderActionMenuProps {
  owner: string;
  repo: string;
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
  onSearch?: () => void;
}

export function HeaderActionMenu({ owner, repo, analysis, meta: propsMeta, onSearch }: HeaderActionMenuProps) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<'main' | 'branch-switch' | 'branch-compare'>('main');
  const menuRef = useRef<HTMLDivElement>(null);
  const setToastMessage = useVizStore((s) => s.setToastMessage);

  const {
    activeView,
    setActiveView,
    explorerOpen,
    setExplorerOpen,
    aiSidebarOpen,
    setAiSidebarOpen,
    selectedBranch,
    setSelectedBranch,
    compareBranch,
    setCompareBranch,
    workspaceMode,
    setWorkspaceMode,
  } = useVizStore();

  const { data: branches, isLoading: isBranchesLoading } = useRepoBranches(
    owner,
    repo,
    isMenuOpen && activeSubPanel !== 'main'
  );

  const meta = propsMeta ?? analysis?.meta;
  const totalCommits = getTotalCommits(analysis);
  const defaultBranch = meta?.defaultBranch || 'main';
  const activeBranch = selectedBranch || defaultBranch;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setActiveSubPanel('main');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveSubPanel('main');
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await copyToClipboard(url);
      setCopied(true);
      setToastMessage(url);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToastMessage('Failed to copy link: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleBranchSelect = (branchName: string) => {
    if (activeSubPanel === 'branch-switch') {
      setSelectedBranch(branchName);
      if (compareBranch === branchName) setCompareBranch(null);
    } else {
      if (compareBranch === branchName) {
        setCompareBranch(null);
      } else {
        setCompareBranch(branchName);
      }
    }
  };

  const mobileButtonClass =
    'flex h-7 px-2.5 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all duration-200 outline-none cursor-pointer';

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Tooltip>
        <TooltipTrigger type="button" className={mobileButtonClass + ' text-zinc-400 hover:text-white hover:bg-zinc-800/80'} onClick={onSearch}>
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline font-sans">Search</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Search in repository</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(mobileButtonClass, 'hidden sm:flex', copied ? 'bg-green-600/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80')}
          onClick={handleShare}
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-green-400 animate-in fade-in-0 scale-in-95 duration-100" /><span className="hidden lg:inline font-sans">Copied!</span></>
          ) : (
            <><Share2 className="h-3.5 w-3.5" /><span className="hidden lg:inline font-sans">Share</span></>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy shareable link</TooltipContent>
      </Tooltip>

      <div className="hidden lg:block"><SettingsPopover /></div>
      <div className="lg:hidden">
        <SettingsPopover open={isSettingsOpen} onOpenChange={setIsSettingsOpen} hideTrigger />
      </div>

      <div className="relative sm:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={cn(mobileButtonClass, isMenuOpen ? 'text-white bg-zinc-800/80' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80')}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full z-[100] mt-2 w-56 max-h-[calc(100vh-70px)] overflow-y-auto custom-scrollbar rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
            {activeSubPanel === 'main' ? (
              <>
                <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">Actions</div>
                <button type="button" onClick={() => { void handleShare(); closeMenu(); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors sm:hidden">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5 text-[#8b949e]" />}
                  <span>{copied ? 'Copied link' : 'Share'}</span>
                </button>
                <button type="button" onClick={() => { setExplorerOpen(!explorerOpen); if (!explorerOpen) setAiSidebarOpen(false); closeMenu(); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors">
                  <PanelLeft className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>{explorerOpen ? 'Hide Explorer' : 'Open Explorer'}</span>
                </button>
                <button type="button" onClick={() => { setAiSidebarOpen(!aiSidebarOpen); if (!aiSidebarOpen) setExplorerOpen(false); closeMenu(); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors">
                  <PanelRight className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>{aiSidebarOpen ? 'Hide AI Sidebar' : 'Open AI Sidebar'}</span>
                </button>
                <button type="button" onClick={() => setActiveSubPanel('branch-switch')}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                    <span className="truncate">Switch Branch</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono truncate max-w-[80px] ml-2">{activeBranch}</span>
                </button>
                <button type="button" onClick={() => setActiveSubPanel('branch-compare')}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                    <span className="truncate">Compare Branch</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono truncate max-w-[80px] ml-2">{compareBranch || 'None'}</span>
                </button>

                <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
                <ViewModeActions
                  activeView={activeView}
                  workspaceMode={workspaceMode}
                  onViewChange={(id) => { setActiveView(id as 'graph' | 'architecture' | 'contributors' | 'commits'); closeMenu(); }}
                  onWorkspaceModeChange={(id) => {
                    setWorkspaceMode(id as 'focus' | 'analysis' | 'learning' | 'full');
                    if (window.innerWidth < 1024) { setExplorerOpen(false); setAiSidebarOpen(false); }
                    closeMenu();
                  }}
                  onClose={closeMenu}
                />

                <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
                <button type="button" onClick={() => { closeMenu(); setIsSettingsOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors lg:hidden">
                  <Settings className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>Settings</span>
                </button>

                {(totalCommits > 0 || meta) && (
                  <>
                    <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
                    <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">Repository stats</div>
                    {totalCommits > 0 && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#8b949e]">
                        <HistoryIcon />
                        <span className="truncate">{totalCommits.toLocaleString()} commits</span>
                      </div>
                    )}
                    {meta && (
                      <a href={`https://github.com/${meta.fullName}`} target="_blank" rel="noopener noreferrer" onClick={closeMenu}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors">
                        <StarIcon />
                        <span className="font-mono">{formatStars(meta.stars)} stars</span>
                      </a>
                    )}
                  </>
                )}
              </>
            ) : (
              <MobileBranchPanel
                activeSubPanel={activeSubPanel}
                onBack={() => setActiveSubPanel('main')}
                branches={branches}
                isLoading={isBranchesLoading}
                activeBranch={activeBranch}
                compareBranch={compareBranch}
                onBranchSelect={handleBranchSelect}
                onClose={closeMenu}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}
