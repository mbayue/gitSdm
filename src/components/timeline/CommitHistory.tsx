import { useMemo } from 'react';
import { GitCommit, ExternalLink } from 'lucide-react';
import type { TimelineWeek } from '@/types';

interface CommitHistoryProps {
  timeline: TimelineWeek[];
  owner: string;
  repo: string;
}

export function CommitHistory({ timeline, owner, repo }: CommitHistoryProps) {
  const commits = useMemo(() => {
    const all = timeline.flatMap((w) => w.commits);
    // Remove duplicates if any (by SHA) and sort by date descending
    const unique = Array.from(new Map(all.map((c) => [c.sha, c])).values());
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timeline]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!commits.length) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 text-center">
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <GitCommit className="h-3.5 w-3.5 opacity-50" />
          No recent commits found
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <div className="space-y-2">
        {commits.map((commit) => {
          const commitUrl = `https://github.com/${owner}/${repo}/commit/${commit.sha}`;
          return (
            <div
              key={commit.sha}
              className="group flex items-start justify-between gap-3 rounded-lg border border-white/[0.03] bg-zinc-950/40 p-2.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.02] hover:shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {commit.authorAvatar ? (
                  <img
                    src={commit.authorAvatar}
                    alt={commit.authorLogin || 'Avatar'}
                    className="h-6 w-6 shrink-0 rounded-full border border-white/10"
                    onError={(e) => {
                      // Fallback to placeholder or generic avatar icon if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-400">
                    <GitCommit className="h-3 w-3" />
                  </div>
                )}
                
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200 line-clamp-1 group-hover:text-white transition-colors duration-150">
                    {commit.message}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-400 truncate max-w-[100px]">
                      {commit.authorLogin || commit.authorName || 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>{formatDate(commit.date)}</span>
                  </div>
                </div>
              </div>

              <a
                href={commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 shrink-0 rounded-md border border-white/[0.06] bg-zinc-900/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 hover:border-violet-500/30 hover:bg-violet-950/20 hover:text-violet-400 transition-all duration-150"
              >
                {commit.sha}
                <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
