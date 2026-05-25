import { Link } from 'react-router-dom';
import { GitBranch, Share2, Check, Sun, Moon } from 'lucide-react';
import type { RepoMeta } from '@/types';
import { formatStars } from '@/lib/utils';
import { useState } from 'react';
import { useVizStore } from '@/stores/viz-store';
import { BranchSelector } from './BranchSelector';
import { ApiKeyPopover } from './ApiKeyPopover';

interface VizTopBarProps {
  meta?: RepoMeta;
}

export function VizTopBar({ meta }: VizTopBarProps) {
  const [copied, setCopied] = useState(false);
  const setToastMessage = useVizStore((s) => s.setToastMessage);
  const { theme, toggleTheme } = useVizStore();

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setToastMessage(url);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  return (
    <header className="relative z-50 flex h-12 shrink-0 items-center gap-4 border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 text-white">
        <div className="logo-bg flex h-7 w-7 items-center justify-center rounded-md">
          <GitBranch className="h-3.5 w-3.5" />
        </div>
      </Link>
      {meta && (() => {
        const [owner, repoName] = meta.fullName.split('/');
        return (
          <div className="hidden items-center text-sm font-mono sm:flex">
            <a
              href={`https://github.com/${owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-violet-400 transition-colors"
            >
              {owner}
            </a>
            <span className="mx-1 text-zinc-600 select-none">/</span>
            <a
              href={`https://github.com/${meta.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-violet-400 transition-colors"
            >
              {repoName}
            </a>
            <span className="mx-2.5 text-zinc-800 dark:text-zinc-700 select-none">|</span>
            <BranchSelector owner={owner} repo={repoName} defaultBranch={meta.defaultBranch} />
            <span className="ml-2.5 text-xs text-zinc-500">★ {formatStars(meta.stars)}</span>
          </div>
        );
      })()}
      <div className="ml-auto flex items-center gap-2">
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
        <ApiKeyPopover />
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
