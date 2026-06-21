import { useEffect, useRef, useState } from 'react';

import {
  Search,
  Share2,
  Check,
  MoreHorizontal,
  History,
  Star,
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

  const {
    activeView,
    setActiveView,
  } = useVizStore();



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
            <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">
              Actions
            </div>
            <button
              type="button"
              onClick={() => {
                onSearch?.();
                closeMenu();
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors sm:hidden"
            >
              <Search className="h-3.5 w-3.5 text-[#8b949e]" />
              <span>Search</span>
            </button>

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
          </div>
        )}
      </div>
    </div>
  );
}