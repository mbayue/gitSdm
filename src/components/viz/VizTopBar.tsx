import { Link } from 'react-router-dom';
import { GitBranch, Share2, Check, Search } from 'lucide-react';
import type { RepoMeta } from '@/types';
import { formatStars } from '@/lib/utils';
import { useState } from 'react';
import { useVizStore } from '@/stores/viz-store';
import { BranchSelector } from './BranchSelector';
import { SettingsPopover } from './SettingsPopover';

interface VizTopBarProps {
  meta?: RepoMeta;
  owner?: string;
  repo?: string;
}

export function VizTopBar({ meta, owner: fallbackOwner, repo: fallbackRepo }: VizTopBarProps) {
  const [copied, setCopied] = useState(false);
  const setToastMessage = useVizStore((s) => s.setToastMessage);
  // const { theme, toggleTheme } = useVizStore();

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
    <header className="relative z-[60] flex h-12 shrink-0 items-center gap-4 border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 text-white">
        <div className="logo-bg flex h-7 w-7 items-center justify-center rounded-md">
          <GitBranch className="h-3.5 w-3.5" />
        </div>
      </Link>
      {(meta || (fallbackOwner && fallbackRepo)) && (() => {
        const owner = meta ? meta.fullName.split('/')[0] : fallbackOwner;
        const repoName = meta ? meta.fullName.split('/')[1] : fallbackRepo;
        return (
          <div className="flex flex-1 items-center text-sm font-mono min-w-0">
            <div className="flex items-center truncate min-w-0">
              <a
                href={`https://github.com/${owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-violet-400 transition-colors truncate"
              >
                {owner}
              </a>
              <span className="mx-1 text-zinc-600 select-none shrink-0">/</span>
              <a
                href={`https://github.com/${owner}/${repoName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-violet-400 transition-colors truncate"
              >
                {repoName}
              </a>
            </div>
            <span className="mx-1.5 sm:mx-2.5 text-zinc-800 dark:text-zinc-700 select-none shrink-0">|</span>
            <div className="shrink-0">
              <BranchSelector owner={owner!} repo={repoName!} defaultBranch={meta?.defaultBranch || 'main'} />
            </div>
            {meta && <span className="hidden sm:inline ml-2.5 text-xs text-zinc-500 shrink-0">★ {formatStars(meta.stars)}</span>}
          </div>
        );
      })()}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          to={`/${fallbackOwner}/${fallbackRepo}/search`}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-2 sm:px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Search</span>
        </Link>
        {/* Theme toggle disabled/hidden for now
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-zinc-400" /> : <Moon className="h-4 w-4 text-zinc-400" />}
        </button>
        */}
        <SettingsPopover />
        <button
          type="button"
          onClick={handleShare}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-2 sm:px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="hidden sm:inline text-green-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
