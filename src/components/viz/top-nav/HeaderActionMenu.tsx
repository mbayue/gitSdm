import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Search,
  Share2,
  Check,
  MoreHorizontal,
  History,
  Star,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import { SettingsPopover } from '../SettingsPopover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatStars } from '@/lib/utils';
import type { RepoMeta, RepoAnalysis } from '@/types';
import { cn } from '@/lib/utils';
import { getTotalCommits } from './getRepoStats';
import { VIEW_TABS } from './viewTabs';

interface HeaderActionMenuProps {
  owner: string;
  repo: string;
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
  onSearch?: () => void;
}

export function HeaderActionMenu({ analysis, meta: propsMeta, onSearch }: HeaderActionMenuProps) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const setToastMessage = useVizStore((s) => s.setToastMessage);
  const reactFlow = useReactFlow();

  const {
    resetFilters,
    setSelectedNodeId,
    setFocusedFilePath,
    triggerGraphAction,
    layoutType,
    activeView,
    setActiveView,
  } = useVizStore();

  const handleReset = () => {
    resetFilters();
    setSelectedNodeId(null);
    setFocusedFilePath(null);
    triggerGraphAction('reset');
    if (activeView === 'graph' && layoutType === 'force') {
      reactFlow.fitView({ duration: 400, padding: 0.35 });
    }
  };

  const meta = propsMeta ?? analysis?.meta;
  const totalCommits = getTotalCommits(analysis);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

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
    'h-8 px-3 rounded-full border border-white/[0.06] bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/[0.12] text-xs font-medium transition-all duration-200 hidden sm:flex items-center justify-center gap-1.5 outline-none cursor-pointer';

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleReset}
          className={cn(desktopButtonClass, 'hidden md:flex')}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden lg:inline font-sans">Reset View</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Reset canvas filters & zoom</TooltipContent>
      </Tooltip>

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
            copied
              ? 'bg-green-600/10 border-green-500/25 text-green-300 shadow-inner'
              : 'border-white/[0.06] bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/[0.12]',
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
            'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 outline-none cursor-pointer',
            isMenuOpen
              ? 'border-violet-400/40 bg-violet-500/20 text-violet-200 shadow-[0_0_18px_rgba(139,92,246,0.18)]'
              : 'border-violet-500/20 bg-violet-500/10 text-violet-300 hover:border-violet-500/35 hover:bg-violet-500/20 hover:text-violet-100',
          )}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full z-[100] mt-2 w-60 rounded-2xl border border-white/10 bg-zinc-950 p-1.5 shadow-xl">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">
              Actions
            </div>
            <button
              type="button"
              onClick={() => {
                onSearch?.();
                closeMenu();
              }}
              className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white sm:hidden"
            >
              <Search className="h-4 w-4 text-zinc-500" />
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleReset();
                closeMenu();
              }}
              className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white md:hidden"
            >
              <RotateCcw className="h-4 w-4 text-zinc-500" />
              <span>Undo / Reset view</span>
            </button>
            <button
              type="button"
              onClick={() => {
                void handleShare();
                closeMenu();
              }}
              className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white sm:hidden"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4 text-zinc-500" />}
              <span>{copied ? 'Copied link' : 'Share'}</span>
            </button>

            <div className="my-1 h-px bg-white/[0.06]" />
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">
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
                    'flex min-h-10 w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/5 hover:text-white',
                    isSelected ? 'bg-violet-600/10 text-violet-300' : 'text-zinc-300',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn('h-4 w-4', isSelected ? 'text-violet-400' : 'text-zinc-500')} />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-violet-400" />}
                </button>
              );
            })}

            <div className="my-1 h-px bg-white/[0.06]" />
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setIsSettingsOpen(true);
              }}
              className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <Settings className="h-4 w-4 text-zinc-500" />
              <span>Settings</span>
            </button>

            {(totalCommits > 0 || meta) && (
              <>
                <div className="my-1 h-px bg-white/[0.06]" />
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none">
                  Repository stats
                </div>
                {totalCommits > 0 && (
                  <div className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400">
                    <History className="h-4 w-4 text-zinc-500" />
                    <span className="truncate">{totalCommits.toLocaleString()} commits</span>
                  </div>
                )}
                {meta && (
                  <a
                    href={`https://github.com/${meta.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Star className="h-4 w-4 text-amber-500/80 fill-amber-500/10" />
                    <span className="font-mono">{formatStars(meta.stars)} stars</span>
                  </a>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}