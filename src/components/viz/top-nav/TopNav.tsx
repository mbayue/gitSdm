import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Search, X } from 'lucide-react';
import type { RepoMeta, RepoAnalysis } from '@/types';
import { RepoIdentity } from './RepoIdentity';
import { BranchSwitcher } from './BranchSwitcher';
import { WorkspaceModeSelector } from './WorkspaceModeSelector';
import { HeaderStats } from './HeaderStats';
import { HeaderActionMenu } from './HeaderActionMenu';

interface TopNavProps {
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
  owner?: string;
  repo?: string;
}

export function TopNav({
  analysis,
  meta: propsMeta,
  owner: fallbackOwner = '',
  repo: fallbackRepo = '',
}: TopNavProps) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const meta = propsMeta ?? analysis?.meta;
  const owner = meta ? meta.fullName.split('/')[0] : fallbackOwner;
  const repoName = meta ? meta.fullName.split('/')[1] : fallbackRepo;
  useEffect(() => {
    if (isSearchMode) {
      searchInputRef.current?.focus();
    }
  }, [isSearchMode]);

  const closeSearch = () => {
    setIsSearchMode(false);
    setSearchQuery('');
  };

  if (isSearchMode) {
    return (
      <header className="relative z-[60] flex h-14 w-full shrink-0 items-center gap-2 border-b border-white/[0.06] bg-zinc-950/95 px-2 font-sans backdrop-blur-xl sm:h-12 sm:px-4">
        <button
          type="button"
          onClick={closeSearch}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search repository..."
            className="h-10 w-full rounded-full border border-violet-500/30 bg-zinc-900/90 pl-9 pr-10 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={closeSearch}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
    );
  }

  return (
    <header className="relative z-[60] flex h-14 w-full shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-zinc-950/95 px-2 select-none font-sans backdrop-blur-xl sm:h-12 sm:px-4">
      {/* Mobile: simplified hierarchy */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
        <Link
          to="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400 transition-all hover:border-violet-500/35 hover:bg-violet-500/20"
          aria-label="Go to homepage"
        >
          <GitBranch className="h-5 w-5" />
        </Link>
        {owner && repoName ? (
          <a
            href={`https://github.com/${owner}/${repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-sm font-semibold text-zinc-100 transition-colors hover:text-violet-300"
            title={`${owner}/${repoName}`}
          >
            {repoName}
          </a>
        ) : (
          <span className="truncate text-sm font-semibold text-zinc-100">Git Graph</span>
        )}
      </div>

      <div className="hidden min-w-0 shrink items-center gap-3 justify-start sm:flex">
        {owner && repoName && (
          <>
            <RepoIdentity owner={owner} repoName={repoName} />
            <span className="hidden sm:inline text-zinc-800 font-sans font-light select-none shrink-0">/</span>
            <BranchSwitcher
              owner={owner}
              repo={repoName}
              defaultBranch={meta?.defaultBranch || 'main'}
            />
          </>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center justify-end">
        <div className="hidden items-center gap-3 sm:flex">
          <WorkspaceModeSelector />

          <div className="hidden md:flex items-center gap-3">
            <div className="w-px h-3.5 bg-white/[0.08]" />
            <HeaderStats analysis={analysis} meta={meta} />
          </div>
        </div>

        {owner && repoName && (
          <>
            <div className="hidden sm:block mx-3 h-3.5 w-px bg-white/[0.08]" />
            <HeaderActionMenu
              owner={owner}
              repo={repoName}
              analysis={analysis}
              meta={meta}
              onSearch={() => navigate(`/${owner}/${repoName}/search`)}
            />
          </>
        )}
      </div>
    </header>
  );
}
export default TopNav;
