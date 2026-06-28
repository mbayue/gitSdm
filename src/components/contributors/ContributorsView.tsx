import { useMemo } from 'react';
import { Users, Calendar, Flame, TrendingUp, GitCommit, ExternalLink, Trophy } from 'lucide-react';
import type { RepoAnalysis } from '@/types';
import { RepoTimeline } from '../timeline/RepoTimeline';

interface ContributorsViewProps {
  analysis: RepoAnalysis;
  owner: string;
  repo: string;
}

const statLabelClass = "block text-[10px] leading-3 text-zinc-400 uppercase font-mono tracking-wider font-semibold truncate";
const statValueClass = "text-2xl leading-8 font-bold text-white mt-0.5 truncate";

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
    <div className="flex h-full w-full flex-col bg-zinc-950 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      {/* Header Panel */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center select-none">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-ui-active-text-green animate-pulse" />
            Contributors & Repository Activity
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Repository diagnostics, engagement rankings, and commit statistics for <span className="font-mono text-zinc-300">{owner}/{repo}</span>
          </p>
        </div>
      </div>

      {/* Grid of KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
        {/* Total Contributors */}
        <div className="group relative rounded-xl border border-white/[0.04] bg-zinc-900/20 p-4 transition-all duration-350 hover:bg-zinc-900/40 hover:-translate-y-0.5 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-ui-active/0 via-ui-active/30 to-ui-active/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ui-active/15 border border-ui-active/35 text-ui-active-text-green group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
	              <span className={statLabelClass}>Total Contributors</span>
	              <h3 className={statValueClass}>{stats.totalContributors}</h3>
            </div>
          </div>
        </div>

        {/* Total Commits */}
        <div className="group relative rounded-xl border border-white/[0.04] bg-zinc-900/20 p-4 transition-all duration-350 hover:bg-zinc-900/40 hover:-translate-y-0.5 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <GitCommit className="h-5 w-5" />
            </div>
            <div>
	              <span className={statLabelClass}>Total Commits</span>
	              <h3 className={statValueClass}>{stats.totalCommits}</h3>
            </div>
          </div>
        </div>

        {/* Most Active Contributor */}
        <div className="group relative rounded-xl border border-white/[0.04] bg-zinc-900/20 p-4 transition-all duration-350 hover:bg-zinc-900/40 hover:-translate-y-0.5 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
	              <span className={statLabelClass}>Most Active Contributor</span>
	              <h3 className={statValueClass} title={`${stats.mostActiveName} (${stats.mostActiveCommits} commits)`}>
	                {stats.mostActiveName}
	              </h3>
            </div>
          </div>
        </div>

        {/* Active Weeks */}
        <div className="group relative rounded-xl border border-white/[0.04] bg-zinc-900/20 p-4 transition-all duration-350 hover:bg-zinc-900/40 hover:-translate-y-0.5 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-[calc(100vh-270px)] min-h-[500px]">
        {/* Left Column: Contributor Leaderboard */}
        <div className="lg:col-span-5 rounded-xl border border-white/[0.04] bg-zinc-900/10 p-5 flex flex-col h-full overflow-hidden">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-1.5 select-none shrink-0">
            <TrendingUp className="h-4 w-4 text-ui-active-text-green" />
            Leaderboard & Commit Share
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 space-y-3">
            {sortedContributors.map((c, idx) => {
              const sharePercent = stats.totalCommits > 0 
                ? Math.round((c.contributions / stats.totalCommits) * 100)
                : 0;

              return (
                <div key={c.login} className="flex items-center gap-4 bg-zinc-900/25 border border-white/[0.02] hover:border-white/[0.06] rounded-xl p-3.5 transition-all">
                  {/* Rank Badge */}
                  <div className="flex h-7 w-7 items-center justify-center shrink-0 rounded-full font-mono text-xs font-bold bg-zinc-950 border border-white/5 text-zinc-400">
                    {idx === 0 ? (
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                    ) : idx === 1 ? (
                      <span className="text-zinc-300">2</span>
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
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white/5 group-hover:ring-ui-active-text-green transition-all duration-200"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ui-active-text-green border border-zinc-950 text-[8px] text-zinc-950">
                      <ExternalLink className="h-2 w-2" />
                    </div>
                  </a>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`https://github.com/${c.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-zinc-200 hover:text-ui-active-text-green transition-colors truncate"
                      >
                        {c.login}
                      </a>
                      <span className="text-xs font-mono text-zinc-400 shrink-0">
                        {c.contributions} commits
                      </span>
                    </div>
                    
                    {/* Share Bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="relative flex-1 h-1.5 rounded-full bg-zinc-950 overflow-hidden border border-white/[0.02]">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-ui-active-text-green to-[#58a6ff] shadow-md shadow-ui-active-text-green/20 transition-all duration-500"
                          style={{ width: `${sharePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 w-8 text-right shrink-0">
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
        <div className="lg:col-span-7 rounded-xl border border-white/[0.04] bg-zinc-900/10 p-5 flex flex-col h-full overflow-hidden">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-1.5 select-none shrink-0">
            <Calendar className="h-4 w-4 text-ui-active-text-green" />
            Commit Activity Timeline
          </h3>
          <div className="flex-1 flex items-center justify-center bg-zinc-900/5 rounded-xl border border-white/[0.02] p-4">
            <RepoTimeline timeline={timeline} height="100%" />
          </div>
        </div>
      </div>
    </div>
  );
}
