import { TooltipHint } from '@/components/ui/tooltip';
import { useMemo } from 'react';
import { Users, Calendar, Flame, TrendingUp, GitCommit, ExternalLink, Trophy } from 'lucide-react';
import type { RepoAnalysis } from '@/types';
import { RepoTimeline } from '../timeline/RepoTimeline';

interface ContributorsViewProps {
  analysis: RepoAnalysis;
  owner: string;
  repo: string;
}

const statLabelClass = "block text-xs leading-5 text-muted-foreground font-medium";
const statValueClass = "text-2xl leading-8 font-bold text-foreground mt-0.5 truncate";

/**
 * Fixed chart height for the commit activity timeline.
 * Responsive-height contract: the wrapper's min-height (see
 * {@link getContributorTimelineWrapperStyle}) must match this value so the
 * recharts `ResponsiveContainer` always has a sized parent (it renders
 * nothing when the parent height is 0). Width stays fluid.
 */
export const CONTRIBUTOR_TIMELINE_HEIGHT = 280;

/**
 * Wrapper style for the commit activity timeline. Derived from
 * {@link CONTRIBUTOR_TIMELINE_HEIGHT} (inline style — Tailwind cannot
 * interpolate a TS constant into an arbitrary-value class, so a hardcoded class would
 * silently drift from the chart height). Changing the constant changes
 * rendering.
 */
export function getContributorTimelineWrapperStyle(): { minHeight: number } {
  return { minHeight: CONTRIBUTOR_TIMELINE_HEIGHT };
}

export function ContributorsView({ analysis, owner, repo }: ContributorsViewProps) {
  const { contributors, timeline } = analysis;

  const stats = useMemo(() => {
    const totalContributors = contributors.length;
    const totalCommits = contributors.reduce((sum, c) => sum + c.contributions, 0);
    const mostActive = contributors.reduce((max, c) => (c.contributions > max.contributions ? c : max), contributors[0] || { login: 'N/A', contributions: 0 });
    
    // Calculate total weeks
    const activeWeeks = timeline.length;

    return {
      totalContributors,
      totalCommits,
      mostActiveName: mostActive.login,
      mostActiveCommits: mostActive.contributions,
      activeWeeks
    };
  }, [contributors, timeline]);

  // Sort contributors by contributions descending
  const sortedContributors = useMemo(() => {
    return [...contributors].sort((a, b) => b.contributions - a.contributions);
  }, [contributors]);

  return (
    <div className="workspace-view-content flex h-full w-full flex-col bg-background p-4 lg:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      {/* Header Panel */}
      <div className="workspace-view-header">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-ui-active-text-green " />
            Contributors
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contribution totals and recent activity for <span className="font-mono text-foreground">{owner}/{repo}</span>
          </p>
        </div>
      </div>

      {/* Grid of KPI Cards */}
      <div className="workspace-stat-grid">
        {/* Total Contributors */}
        <div className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-350 hover:bg-secondary  overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-ui-active/0 via-ui-active/30 to-ui-active/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ui-active/15 border border-ui-active/35 text-ui-active-text-green  transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
	              <span className={statLabelClass}>Contributors</span>
	              <h3 className={statValueClass}>{stats.totalContributors}</h3>
            </div>
          </div>
        </div>

        {/* Total Commits */}
        <div className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-350 hover:bg-secondary  overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-success  transition-transform">
              <GitCommit className="h-5 w-5" />
            </div>
            <div>
	              <span className={statLabelClass}>Total Commits</span>
	              <h3 className={statValueClass}>{stats.totalCommits}</h3>
            </div>
          </div>
        </div>

        {/* Most Active Contributor */}
        <div className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-350 hover:bg-secondary  overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-warning  transition-transform">
              <Flame className="h-5 w-5 " />
            </div>
            <div className="min-w-0 flex-1">
	              <span className={statLabelClass}>Most active</span>
	              <TooltipHint content={`${stats.mostActiveName} (${stats.mostActiveCommits} commits)`}><h3 className={statValueClass}>
	                {stats.mostActiveName}
	              </h3></TooltipHint>
            </div>
          </div>
        </div>

        {/* Active Weeks */}
        <div className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-350 hover:bg-secondary  overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400  transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
	              <span className={statLabelClass}>Active Timeline</span>
	              <h3 className={statValueClass}>{stats.activeWeeks} Weeks</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main visual panel layout */}
      <div className="workspace-activity-grid">
        {/* Left Column: Contributor Leaderboard */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col h-full overflow-hidden">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5 select-none shrink-0">
            <TrendingUp className="h-4 w-4 text-ui-active-text-green" />
            Leaderboard & Commit Share
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border space-y-3">
            {sortedContributors.map((c, idx) => {
              const sharePercent = stats.totalCommits > 0 
                ? Math.round((c.contributions / stats.totalCommits) * 100)
                : 0;

              return (
                <div key={c.login} className="flex items-center gap-2 bg-card border border-border hover:border-ring/50 rounded-xl p-3.5 transition-all">
                  {/* Rank Badge */}
                  <div className="flex h-7 w-7 items-center justify-center shrink-0 rounded-full font-mono text-xs font-bold bg-background border border-border text-muted-foreground">
                    {idx === 0 ? (
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                    ) : idx === 1 ? (
                      <span className="text-foreground">2</span>
                    ) : idx === 2 ? (
                      <span className="text-amber-600">3</span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Avatar */}
                  <a
                    href={`https://github.com/${c.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group shrink-0"
                  >
                    <img
                      src={c.avatarUrl}
                      alt={c.login}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-border group-hover:ring-ui-active-text-green transition-all duration-200"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ui-active-text-green border border-background text-[8px] text-background">
                      <ExternalLink className="h-2 w-2" />
                    </div>
                  </a>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={`https://github.com/${c.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-foreground hover:text-ui-active-text-green transition-colors truncate"
                      >
                        {c.login}
                      </a>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {c.contributions} commits
                      </span>
                    </div>
                    
                    {/* Share Bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="relative flex-1 h-1.5 rounded-full bg-background overflow-hidden border border-border">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-ui-active-text-green to-accent shadow-md shadow-ui-active-text-green/20 transition-all duration-500"
                          style={{ width: `${sharePercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0">
                        {sharePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Commit Timeline & Chart */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col h-full overflow-hidden">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5 select-none shrink-0">
            <Calendar className="h-4 w-4 text-ui-active-text-green" />
            Commit Activity Timeline
          </h3>
          <div className="flex-1 flex items-center justify-center bg-card rounded-lg p-2" style={getContributorTimelineWrapperStyle()}>
            <RepoTimeline timeline={timeline} height={CONTRIBUTOR_TIMELINE_HEIGHT} />
          </div>
        </div>
      </div>
    </div>
  );
}
