import type { RepoMeta, RepoAnalysis } from '@/types';
import { useVizStore } from '@/stores/vizStore';
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
  const meta = propsMeta ?? analysis?.meta;
  const owner = meta ? meta.fullName.split('/')[0] : fallbackOwner;
  const repoName = meta ? meta.fullName.split('/')[1] : fallbackRepo;
  const { compareBranch } = useVizStore();

  return (
    <header className="relative z-[60] flex h-12 w-full shrink-0 items-center justify-between border-b border-white/[0.06] bg-zinc-950 px-4 select-none font-sans">
      {/* Left Zone: Repo Identity, Product View, and Branch Switcher (when not comparing) */}
      <div className="flex items-center gap-3 min-w-0 flex-1 justify-start">
        {owner && repoName && (
          <>
            <RepoIdentity owner={owner} repoName={repoName} />
            {!compareBranch && (
              <>
                <span className="text-zinc-800 font-sans font-light select-none">/</span>
                <BranchSwitcher
                  owner={owner}
                  repo={repoName}
                  defaultBranch={meta?.defaultBranch || 'main'}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Center Zone: Compare Pill (only when comparing) */}
      <div className="flex items-center justify-center shrink-0 px-2">
        {owner && repoName && compareBranch && (
          <BranchSwitcher
            owner={owner}
            repo={repoName}
            defaultBranch={meta?.defaultBranch || 'main'}
          />
        )}
      </div>

      {/* Right Zone: Workspace Mode, Stats, Action Triggers grouped with dividers */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <WorkspaceModeSelector />
        
        {/* Subtle dividers between grouped elements */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-px h-3.5 bg-white/[0.08]" />
          <HeaderStats analysis={analysis} meta={meta} />
        </div>
        
        {owner && repoName && (
          <>
            <div className="w-px h-3.5 bg-white/[0.08]" />
            <HeaderActionMenu
              owner={owner}
              repo={repoName}
              analysis={analysis}
              meta={meta}
            />
          </>
        )}
      </div>
    </header>
  );
}
export default TopNav;
