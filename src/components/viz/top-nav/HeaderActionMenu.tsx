import { useEffect, useRef, useState } from 'react';

import {
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
}

export function HeaderActionMenu({ owner, repo, analysis, meta: propsMeta }: HeaderActionMenuProps) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<'main' | 'branch-switch' | 'branch-compare'>('main');
  const menuRef = useRef<HTMLDivElement>(null);
  const setToastMessage = useVizStore((s) => s.setToastMessage);
  // True opener for the mobile settings popover: stored manually (not as an
  // attached ref) so it survives the menu item unmounting when the menu
  // closes before the dialog opens.
  const settingsOpenerRef = useRef<HTMLElement | null>(null);

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
    'header-action flex items-center justify-center';

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label={copied ? 'Link copied' : 'Share'}
          className={cn(mobileButtonClass, 'hidden sm:flex', copied ? 'bg-green-600/10 text-success' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}
          onClick={handleShare}
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-success animate-in fade-in-0 scale-in-95 duration-100" /><span className="hidden lg:inline font-sans">Copied!</span></>
          ) : (
            <><Share2 className="h-3.5 w-3.5" /><span className="hidden lg:inline font-sans">Share</span></>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy shareable link</TooltipContent>
      </Tooltip>

      <div className="hidden lg:block"><SettingsPopover triggerClassName="icon-button header-action relative" /></div>
      <div className="lg:hidden">
        <SettingsPopover open={isSettingsOpen} onOpenChange={setIsSettingsOpen} hideTrigger openerRef={settingsOpenerRef} />
      </div>

      <div className="relative lg:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={cn(mobileButtonClass, isMenuOpen ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full z-[100] mt-2 w-56 max-h-[calc(100vh-70px)] overflow-y-auto custom-scrollbar rounded-md border border-border bg-card p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
            {activeSubPanel === 'main' ? (
              <>
                <div className="px-2.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono select-none">Actions</div>
                <button type="button" onClick={() => { void handleShare(); closeMenu(); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors sm:hidden">
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Share2 className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span>{copied ? 'Copied link' : 'Share'}</span>
                </button>
                <button type="button" onClick={() => { setExplorerOpen(!explorerOpen); if (!explorerOpen) setAiSidebarOpen(false); closeMenu(); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors">
                  <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{explorerOpen ? 'Hide Explorer' : 'Open Explorer'}</span>
                </button>
                <button type="button" onClick={() => { setAiSidebarOpen(!aiSidebarOpen); if (!aiSidebarOpen) setExplorerOpen(false); closeMenu(); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors">
                  <PanelRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{aiSidebarOpen ? 'Hide AI Sidebar' : 'Open AI Sidebar'}</span>
                </button>
                <button type="button" onClick={() => setActiveSubPanel('branch-switch')}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">Switch Branch</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[80px] ml-2">{activeBranch}</span>
                </button>
                <button type="button" onClick={() => setActiveSubPanel('branch-compare')}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">Compare Branch</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[80px] ml-2">{compareBranch || 'None'}</span>
                </button>

                <div className="my-1.5 h-px bg-secondary" />
                <ViewModeActions
                  activeView={activeView}
                  workspaceMode={workspaceMode}
                  onViewChange={(id) => { setActiveView(id as 'graph' | 'architecture' | 'contributors' | 'commits'); closeMenu(); }}
                  onWorkspaceModeChange={(id) => {
                    setWorkspaceMode(id as 'focus' | 'analysis' | 'learning' | 'full');
                    closeMenu();
                  }}
                  onClose={closeMenu}
                />

                <div className="my-1.5 h-px bg-secondary" />
                <button type="button" onClick={(e) => { settingsOpenerRef.current = e.currentTarget; closeMenu(); setIsSettingsOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors lg:hidden">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Settings</span>
                </button>

                {(totalCommits > 0 || meta) && (
                  <>
                    <div className="my-1.5 h-px bg-secondary" />
                    <div className="px-2.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono select-none">Repository stats</div>
                    {totalCommits > 0 && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground">
                        <HistoryIcon />
                        <span className="truncate">{totalCommits.toLocaleString()} commits</span>
                      </div>
                    )}
                    {meta && (
                      <a href={`https://github.com/${meta.fullName}`} target="_blank" rel="noopener noreferrer" onClick={closeMenu}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors">
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
    <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}
