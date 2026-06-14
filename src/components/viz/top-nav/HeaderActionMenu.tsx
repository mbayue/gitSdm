import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactFlow } from '@xyflow/react';
import { Search, Share2, Check, MoreHorizontal, History, Star, RotateCcw } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import { SettingsPopover } from '../SettingsPopover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatStars } from '@/lib/utils';
import type { RepoMeta, RepoAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface HeaderActionMenuProps {
  owner: string;
  repo: string;
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
}

export function HeaderActionMenu({ owner, repo, analysis, meta: propsMeta }: HeaderActionMenuProps) {
  const [copied, setCopied] = useState(false);
  const setToastMessage = useVizStore((s) => s.setToastMessage);
  const navigate = useNavigate();
  const reactFlow = useReactFlow();

  const {
    resetFilters,
    setSelectedNodeId,
    setFocusedFilePath,
    triggerGraphAction,
    layoutType,
    activeView,
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
  const totalCommits =
    analysis?.timeline?.reduce((sum, w) => sum + w.count, 0) ??
    analysis?.contributors?.reduce((sum, c) => sum + c.contributions, 0) ??
    0;

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

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Reset Workspace */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleReset}
          className="h-7 px-2.5 rounded-full border border-white/[0.06] bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/[0.12] text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 outline-none cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-sans">Reset View</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Reset canvas filters & zoom</TooltipContent>
      </Tooltip>

      {/* Search Trigger */}
      <Tooltip>
        <TooltipTrigger
          className="h-7 px-2.5 rounded-full border border-white/[0.06] bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/[0.12] text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 outline-none cursor-pointer"
          onClick={() => navigate(`/${owner}/${repo}/search`)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-sans">Search</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Search in repository</TooltipContent>
      </Tooltip>

      {/* Share Trigger */}
      <Tooltip>
        <TooltipTrigger
          className={cn(
            'h-7 px-2.5 rounded-full border text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 outline-none cursor-pointer',
            copied
              ? 'bg-green-600/10 border-green-500/25 text-green-300 shadow-inner'
              : 'border-white/[0.06] bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/[0.12]'
          )}
          onClick={handleShare}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400 animate-in fade-in-0 scale-in-95 duration-100" />
              <span className="hidden sm:inline font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-sans">Share</span>
            </>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">Copy shareable link</TooltipContent>
      </Tooltip>

      {/* Settings Trigger */}
      <SettingsPopover />

      {/* Stats Overflow Menu (Only visible on screens below md) */}
      {(totalCommits > 0 || meta) && (
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-7 w-7 rounded-full border border-white/[0.06] bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/[0.12] transition-all duration-200 flex items-center justify-center outline-none cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-48 bg-zinc-950 border-white/10 shadow-2xl z-[100] p-1 rounded-xl">
              <div className="px-2 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider select-none font-sans border-b border-white/5 mb-1">
                Repository Stats
              </div>
              {totalCommits > 0 && (
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono text-zinc-350 select-none">
                  <History className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{totalCommits.toLocaleString()} commits</span>
                </div>
              )}
              {meta && (
                <a
                  href={`https://github.com/${meta.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-sans text-zinc-350 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500/80 shrink-0 fill-amber-500/10" />
                  <span className="font-mono">{formatStars(meta.stars)} stars</span>
                </a>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
