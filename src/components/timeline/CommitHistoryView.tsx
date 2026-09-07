import { TooltipHint } from '@/components/ui/tooltip';
import { useState, useMemo } from 'react';
import { GitCommit, ExternalLink, Search, Copy, Check, Calendar, User } from 'lucide-react';
import type { TimelineWeek } from '@/types';
import { copyToClipboard } from '@/lib/clipboard';
import { Input } from '@/components/ui/Input';
import { useVizStore } from '@/stores/vizStore';

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
  const setToastMessage = useVizStore((s) => s.setToastMessage);

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

  const handleCopySha = async (sha: string) => {
    try {
      await copyToClipboard(sha);
      setCopiedSha(sha);
      setTimeout(() => setCopiedSha(null), 2000);
    } catch (err) {
      setToastMessage('Failed to copy SHA: ' + (err instanceof Error ? err.message : String(err)));
    }
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
    <div className="workspace-view-content flex h-full w-full flex-col bg-background p-4 lg:p-5">
      {/* Header */}
      <div className="workspace-view-header">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-ui-active-text-green" />
            Commit history
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent changes in{' '}
            <span className="font-mono text-foreground">{owner}/{repo}</span>
            {branch && (
              <span className="ml-1.5 inline-flex items-center rounded bg-ui-active/15 border border-ui-active/35 px-1.5 py-0.5 font-mono text-xs text-ui-active-text-green">
                {branch}
              </span>
            )}
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Search commits"
            placeholder="Search message, author, or SHA…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 bg-card pl-9 pr-4 text-sm dark:bg-card"
          />
        </div>
      </div>

      <p role="status" className="mb-3 text-xs text-muted-foreground">
        {filteredCommits.length} of {commits.length} recent commits
      </p>
      {/* Loading skeleton while branch data is fetching */}
      {isLoading ? (
        <div className="flex-1 overflow-hidden">
          <div className="relative pl-6 border-l border-border ml-3 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-secondary animate-pulse" />
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-secondary animate-pulse" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 w-3/4 rounded bg-secondary animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {filteredCommits.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
              <GitCommit className="h-8 w-8 text-muted-foreground mb-2 opacity-60" />
              <p className="text-sm text-muted-foreground font-medium">{search ? 'No matching commits' : 'No recent commits'}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? 'Try a different message, author, or SHA.' : 'Commit activity will appear here when available.'}</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l border-border ml-3 space-y-3">
              {filteredCommits.map((commit) => {
                const commitUrl = `https://github.com/${owner}/${repo}/commit/${commit.sha}`;
                const isCopied = copiedSha === commit.sha;

                return (
                  <div key={commit.sha} className="relative group">
                    <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-background bg-card text-muted-foreground group-hover:border-ui-active/40 group-hover:bg-ui-active/10 transition-all duration-200 shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground group-hover:bg-ui-active-text-green transition-colors" />
                    </span>

                    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring/50">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-1 basis-64 gap-3 min-w-0">
                          {commit.authorLogin ? (
                            <a
                              href={`https://github.com/${commit.authorLogin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group shrink-0"
                            >
                              {commit.authorAvatar ? (
                                <img
                                  src={commit.authorAvatar}
                                  alt={commit.authorLogin || 'Avatar'}
                                  className="h-9 w-9 shrink-0 rounded-full border border-border shadow-sm hover:border-ui-active-text-green hover:ring-2 hover:ring-ui-active/20 transition-all duration-200"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:border-ui-active/50 hover:text-ui-active-text-green transition-all">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                            </a>
                          ) : (
                            commit.authorAvatar ? (
                              <img
                                src={commit.authorAvatar}
                                alt={commit.authorName || 'Avatar'}
                                className="h-9 w-9 shrink-0 rounded-full border border-border shadow-sm"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
                                <User className="h-4 w-4" />
                              </div>
                            )
                          )}

                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-foreground leading-snug group-hover:text-foreground transition-colors duration-150 break-words">
                              {commit.message}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              {commit.authorLogin ? (
                                <a
                                  href={`https://github.com/${commit.authorLogin}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-foreground hover:text-ui-active-text-green transition-colors"
                                >
                                  {commit.authorLogin}
                                </a>
                              ) : (
                                <span className="font-semibold text-foreground">
                                  {commit.authorName || 'Unknown'}
                                </span>
                              )}
                              {commit.authorLogin && commit.authorName && (
                                <span className="text-xs text-muted-foreground">({commit.authorName})</span>
                              )}
                              <span className="text-muted-foreground">•</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(commit.date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <TooltipHint content="Copy full SHA"><button
                            type="button"
                            onClick={() => handleCopySha(commit.sha)}
                            aria-label={`Copy commit ${commit.sha.slice(0, 7)} SHA`}
                            className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button></TooltipHint>

                          <TooltipHint content={`Open commit ${commit.sha} on GitHub`}><a
                            href={commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-mono text-muted-foreground hover:border-ui-active/35 hover:bg-ui-active/20 hover:text-ui-active-text-green transition-all duration-150"
                          >
                            {commit.sha.slice(0, 7)}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60 transition-opacity duration-150" />
                          </a></TooltipHint>
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
