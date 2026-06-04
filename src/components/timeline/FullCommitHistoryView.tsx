import { useState, useMemo } from 'react';
import { GitCommit, ExternalLink, Search, Copy, Check, Calendar, User } from 'lucide-react';
import type { TimelineWeek } from '@/types';

interface FullCommitHistoryViewProps {
  timeline: TimelineWeek[];
  owner: string;
  repo: string;
  branch?: string | null;
  isLoading?: boolean;
}

export function FullCommitHistoryView({ timeline, owner, repo, branch, isLoading }: FullCommitHistoryViewProps) {
  const [search, setSearch] = useState('');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const commits = useMemo(() => {
    const all = timeline.flatMap((w) => w.commits);
    const unique = Array.from(new Map(all.map((c) => [c.sha, c])).values());
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timeline]);

  const filteredCommits = useMemo(() => {
    if (!search.trim()) return commits;
    const query = search.toLowerCase();
    return commits.filter(
      (c) =>
        c.message.toLowerCase().includes(query) ||
        c.sha.toLowerCase().includes(query) ||
        (c.authorLogin && c.authorLogin.toLowerCase().includes(query)) ||
        (c.authorName && c.authorName.toLowerCase().includes(query))
    );
  }, [commits, search]);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-violet-400 animate-pulse" />
            Commit History
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Chronological log of recent changes in{' '}
            <span className="font-mono text-zinc-300">{owner}/{repo}</span>
            {branch && (
              <span className="ml-1.5 inline-flex items-center rounded bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 font-mono text-[10px] text-violet-400">
                {branch}
              </span>
            )}
          </p>
        </div>

        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search commits, authors, shas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/5 bg-zinc-900/50 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:bg-zinc-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Loading skeleton while branch data is fetching */}
      {isLoading ? (
        <div className="flex-1 overflow-hidden">
          <div className="relative pl-6 border-l border-zinc-800/60 ml-3 space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-zinc-800 animate-pulse" />
                <div className="rounded-xl border border-white/[0.03] bg-zinc-900/10 p-4">
                  <div className="flex gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800 animate-pulse" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 w-3/4 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {filteredCommits.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-white/[0.03] bg-white/[0.01] p-8 text-center">
              <GitCommit className="h-8 w-8 text-zinc-600 mb-2 opacity-60" />
              <p className="text-sm text-zinc-400 font-medium">No matching commits found</p>
              <p className="text-xs text-zinc-500 mt-1">Try broadening your search query</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l border-zinc-800/60 ml-3 space-y-6">
              {filteredCommits.map((commit) => {
                const commitUrl = `https://github.com/${owner}/${repo}/commit/${commit.sha}`;
                const isCopied = copiedSha === commit.sha;

                return (
                  <div key={commit.sha} className="relative group">
                    <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-900 text-zinc-500 group-hover:border-violet-500/40 group-hover:bg-violet-600/10 transition-all duration-200 shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 group-hover:bg-violet-400 transition-colors" />
                    </span>

                    <div className="rounded-xl border border-white/[0.03] bg-zinc-900/10 p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.01] hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 min-w-0">
                          {commit.authorAvatar ? (
                            <img
                              src={commit.authorAvatar}
                              alt={commit.authorLogin || 'Avatar'}
                              className="h-9 w-9 shrink-0 rounded-full border border-white/10 shadow-sm"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-400 shadow-sm">
                              <User className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-150 leading-snug group-hover:text-white transition-colors duration-150 break-words">
                              {commit.message}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                              <span className="font-semibold text-zinc-300">
                                {commit.authorLogin || commit.authorName || 'Unknown'}
                              </span>
                              {commit.authorLogin && commit.authorName && (
                                <span className="text-[10px] text-zinc-500">({commit.authorName})</span>
                              )}
                              <span className="text-zinc-600">•</span>
                              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <Calendar className="h-3 w-3" />
                                {formatDate(commit.date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySha(commit.sha)}
                            title="Copy Full SHA"
                            className="flex items-center justify-center h-7 w-7 rounded-md border border-white/[0.06] bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all duration-150"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <a
                            href={commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-zinc-900/60 px-2.5 py-1 text-xs font-mono text-zinc-400 hover:border-violet-500/35 hover:bg-violet-950/20 hover:text-violet-400 transition-all duration-150"
                          >
                            {commit.sha}
                            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
