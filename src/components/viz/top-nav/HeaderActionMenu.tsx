import { useEffect, useRef, useState } from 'react';

import {
  Search,
  Share2,
  Check,
  MoreHorizontal,
  History,
  Star,
  Settings,
  PanelLeft,
  PanelRight,
  GitBranch,
  ArrowLeft,
  ArrowLeftRight,
} from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import { SettingsPopover } from '../SettingsPopover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatStars } from '@/lib/utils';
import type { RepoMeta, RepoAnalysis } from '@/types';
import { cn } from '@/lib/utils';
import { getTotalCommits } from './getRepoStats';
import { VIEW_TABS } from './viewTabs';
import { useRepoBranches } from '@/hooks/useRepoBranches';

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
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
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
  } = useVizStore();

  const { data: branches, isLoading: isBranchesLoading } = useRepoBranches(owner, repo);

  const meta = propsMeta ?? analysis?.meta;
  const totalCommits = getTotalCommits(analysis);
  const defaultBranch = meta?.defaultBranch || 'main';
  const activeBranch = selectedBranch || defaultBranch;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setActiveSubPanel('main');
        setBranchSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveSubPanel('main');
    setBranchSearchQuery('');
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setToastMessage(url);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const desktopButtonClass =
    'h-7 px-2.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 outline-none cursor-pointer';

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">

      <Tooltip>
        <TooltipTrigger
          type="button"
          className={desktopButtonClass}
          onClick={onSearch}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline font-sans">Search</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Search in repository</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            desktopButtonClass,
            'hidden sm:flex',
            copied
              ? 'bg-green-600/10 text-green-400'
              : '',
          )}
          onClick={handleShare}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400 animate-in fade-in-0 scale-in-95 duration-100" />
              <span className="hidden lg:inline font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline font-sans">Share</span>
            </>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy shareable link</TooltipContent>
      </Tooltip>

      <div className="hidden lg:block">
        <SettingsPopover />
      </div>
      <div className="lg:hidden">
        <SettingsPopover
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          hideTrigger
        />
      </div>

      <div className="relative sm:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={cn(
            'flex h-7 px-2.5 items-center justify-center rounded-md text-xs font-medium transition-all duration-200 outline-none cursor-pointer',
            isMenuOpen
              ? 'text-white bg-zinc-800/80'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80',
          )}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full z-[100] mt-2 w-56 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
            {activeSubPanel === 'main' ? (
              <>
                <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">
                  Actions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleShare();
                    closeMenu();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors sm:hidden"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5 text-[#8b949e]" />}
                  <span>{copied ? 'Copied link' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExplorerOpen(!explorerOpen);
                    if (!explorerOpen) setAiSidebarOpen(false);
                    closeMenu();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                >
                  <PanelLeft className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>{explorerOpen ? 'Hide Explorer' : 'Open Explorer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiSidebarOpen(!aiSidebarOpen);
                    if (!aiSidebarOpen) setExplorerOpen(false);
                    closeMenu();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                >
                  <PanelRight className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>{aiSidebarOpen ? 'Hide AI Sidebar' : 'Open AI Sidebar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubPanel('branch-switch')}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                    <span className="truncate">Switch Branch</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono truncate max-w-[80px] ml-2">
                    {activeBranch}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubPanel('branch-compare')}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                    <span className="truncate">Compare Branch</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono truncate max-w-[80px] ml-2">
                    {compareBranch || 'None'}
                  </span>
                </button>

                <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
                <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">
                  View mode
                </div>
                {VIEW_TABS.map((item) => {
                  const isSelected = activeView === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        closeMenu();
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors',
                        isSelected ? 'bg-[#1c2128] text-[#e6edf3] font-medium' : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className={cn('h-3.5 w-3.5', isSelected ? 'text-[#e6edf3]' : 'text-[#8b949e]')} />
                        <span>{item.label}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#e6edf3]" />}
                    </button>
                  );
                })}

                <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setIsSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors lg:hidden"
                >
                  <Settings className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>Settings</span>
                </button>

                {(totalCommits > 0 || meta) && (
                  <>
                    <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
                    <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">
                      Repository stats
                    </div>
                    {totalCommits > 0 && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#8b949e]">
                        <History className="h-3.5 w-3.5 text-[#8b949e]" />
                        <span className="truncate">{totalCommits.toLocaleString()} commits</span>
                      </div>
                    )}
                    {meta && (
                      <a
                        href={`https://github.com/${meta.fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeMenu}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 text-[#8b949e] fill-[#8b949e]/10" />
                        <span className="font-mono">{formatStars(meta.stars)} stars</span>
                      </a>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col max-h-[300px]">
                {/* Sub-panel Header */}
                <div className="flex items-center gap-1.5 border-b border-[rgba(240,246,252,0.1)] pb-1.5 mb-1.5 px-1 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubPanel('main');
                      setBranchSearchQuery('');
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-semibold text-[#e6edf3]">
                    {activeSubPanel === 'branch-switch' ? 'Switch Branch' : 'Compare Branch'}
                  </span>
                </div>

                {/* Search branch */}
                <div className="relative px-1 mb-1.5 shrink-0">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8b949e]" />
                  <input
                    type="text"
                    value={branchSearchQuery}
                    onChange={(e) => setBranchSearchQuery(e.target.value)}
                    placeholder="Find a branch..."
                    className="h-7 w-full rounded border border-[rgba(240,246,252,0.1)] bg-[#0d1117] pl-7 pr-2 text-[11px] text-[#e6edf3] outline-none placeholder:text-[#8b949e] focus:border-[#58a6ff]"
                  />
                </div>

                {/* Scrollable list of branches */}
                <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[220px] pr-0.5 custom-scrollbar">
                  {isBranchesLoading ? (
                    <div className="py-6 text-center text-[10px] text-[#8b949e]">Loading branches...</div>
                  ) : branches && branches.length > 0 ? (
                    (() => {
                      const filteredBranches = branches.filter((b) =>
                        b.name.toLowerCase().includes(branchSearchQuery.toLowerCase())
                      );
                      
                      if (filteredBranches.length === 0) {
                        return <div className="py-4 text-center text-[10px] text-[#8b949e]">No branches found</div>;
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
                            onClick={() => {
                              if (isSwitchMode) {
                                setSelectedBranch(b.name);
                                if (compareBranch === b.name) setCompareBranch(null);
                              } else {
                                if (compareBranch === b.name) {
                                  setCompareBranch(null);
                                } else {
                                  setCompareBranch(b.name);
                                }
                              }
                              closeMenu();
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors",
                              isDisabled 
                                ? "opacity-40 cursor-not-allowed text-[#8b949e]" 
                                : "hover:bg-[rgba(240,246,252,0.1)] text-[#e6edf3]",
                              isSelected && "bg-[#1c2128] font-medium"
                            )}
                          >
                            <span className="truncate pr-2">{b.name}</span>
                            {isSelected && <Check className="h-3 w-3 text-[#e6edf3] shrink-0" />}
                          </button>
                        );
                      });
                    })()
                  ) : (
                    <div className="py-4 text-center text-[10px] text-[#8b949e]">No branches available</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}