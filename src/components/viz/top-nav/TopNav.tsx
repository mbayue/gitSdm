import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Search, X, PanelLeft, PanelRight } from 'lucide-react';
import type { RepoMeta, RepoAnalysis } from '@/types';
import { RepoIdentity } from './RepoIdentity';
import { BranchSwitcher } from './BranchSwitcher';
import { WorkspaceModeSelector } from './WorkspaceModeSelector';
import { HeaderStats } from './HeaderStats';
import { HeaderActionMenu } from './HeaderActionMenu';
import { useVizStore } from '@/stores/vizStore';
import { cn } from '@/lib/utils';

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
  const explorerOpen = useVizStore((state) => state.explorerOpen);
  const setExplorerOpen = useVizStore((state) => state.setExplorerOpen);
  const aiSidebarOpen = useVizStore((state) => state.aiSidebarOpen);
  const setAiSidebarOpen = useVizStore((state) => state.setAiSidebarOpen);

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
      <header className="relative z-[60] flex h-12 w-full shrink-0 items-center gap-2 border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-2 font-sans sm:px-4">
        <button
          type="button"
          onClick={closeSearch}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8b949e] transition-colors hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b949e]" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search repository..."
            className="h-8 w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] pl-9 pr-10 text-xs text-[#e6edf3] outline-none placeholder:text-[#8b949e] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8b949e] transition-colors hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={closeSearch}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8b949e] transition-colors hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
    );
  }

  return (
    <header className="relative z-[60] flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-2 select-none font-sans sm:px-4">
      {/* Mobile: simplified hierarchy */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
        <Link
          to="/"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[#8b949e] transition-all hover:bg-[#1c2128] hover:text-[#e6edf3]"
          aria-label="Go to homepage"
        >
          <GitBranch className="h-4 w-4" />
        </Link>
        {owner && repoName ? (
          <a
            href={`https://github.com/${owner}/${repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-sm font-semibold text-[#e6edf3] transition-colors hover:text-[#58a6ff]"
            title={`${owner}/${repoName}`}
          >
            {repoName}
          </a>
        ) : (
          <span className="truncate text-sm font-semibold text-[#e6edf3]">Git Graph</span>
        )}
      </div>

      <div className="hidden min-w-0 shrink items-center gap-3 justify-start sm:flex">
        {owner && repoName && (
          <>
            <RepoIdentity owner={owner} repoName={repoName} />
            <span className="hidden sm:inline text-[#8b949e] font-sans font-light select-none shrink-0">/</span>
            <BranchSwitcher
              owner={owner}
              repo={repoName}
              defaultBranch={meta?.defaultBranch || 'main'}
            />
          </>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center justify-end">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tablet-only Sidebar Toggles (hidden on mobile < 640px) */}
          <div className="hidden sm:flex lg:hidden items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={() => {
                setExplorerOpen(!explorerOpen);
                if (!explorerOpen) setAiSidebarOpen(false);
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(240,246,252,0.1)] transition-all outline-none cursor-pointer",
                explorerOpen 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-white/5 text-[#8b949e] hover:bg-white/10 hover:text-[#e6edf3]"
              )}
              title="Toggle File Explorer"
              aria-label="Toggle File Explorer"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAiSidebarOpen(!aiSidebarOpen);
                if (!aiSidebarOpen) setExplorerOpen(false);
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(240,246,252,0.1)] transition-all outline-none cursor-pointer",
                aiSidebarOpen 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-white/5 text-[#8b949e] hover:bg-white/10 hover:text-[#e6edf3]"
              )}
              title="Toggle AI Sidebar"
              aria-label="Toggle AI Sidebar"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="hidden sm:block">
            <WorkspaceModeSelector />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-px h-3.5 bg-[rgba(240,246,252,0.1)]" />
            <HeaderStats analysis={analysis} meta={meta} />
          </div>
        </div>

        {owner && repoName && (
          <>
            <div className="hidden sm:block mx-3 h-3.5 w-px bg-[rgba(240,246,252,0.1)]" />
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
