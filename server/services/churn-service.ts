import { cache, churnCacheKey } from '../cache/lru';
import { getOctokit } from '../github/client';
import { isMockRepo, fetchMockChurn } from '../github/mock-data';
import type { RequestContext } from '../utils/context';

export interface FileChurnData {
  commitCount: number;
  authorCount: number;
  lastModified: string;
  churnScore: number;
}

/**
 * Fetch per-file churn data: commit count, distinct authors, last-modified date.
 * For each file path, calls listCommits with the path filter (last N days).
 * Processes paths in concurrent batches.
 *
 * Note on commitCount precision:
 * When the response is paginated (Link header contains a rel="last" page),
 * commitCount is approximated as `lastPage * 100`. This overestimates when
 * the last page has fewer than 100 commits. For example, 101 commits → 200,
 * 201 commits → 300. The error is non-uniform across files and compounds
 * in the churnScore normalization step. This is an intentional trade-off
 * to avoid O(repos) extra API calls. If precise counts are needed, callers
 * should paginate fully.
 */
export async function fetchRepoChurn(
  owner: string,
  repo: string,
  paths: string[],
  branch?: string,
  tokenOrCtx?: string | RequestContext,
  days = 90,
): Promise<Record<string, FileChurnData>> {
  if (isMockRepo(owner)) {
    return fetchMockChurn(paths);
  }

  const cacheKey = churnCacheKey(owner, repo, branch, days);
  const cached = cache.get<Record<string, FileChurnData>>(cacheKey);
  if (cached) return cached;

  const octokit = (tokenOrCtx && typeof tokenOrCtx === 'object' && 'octokit' in tokenOrCtx)
    ? tokenOrCtx.octokit
    : getOctokit(tokenOrCtx as string | undefined);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result: Record<string, FileChurnData> = {};
  const CONCURRENCY = 7;

  for (let i = 0; i < paths.length; i += CONCURRENCY) {
    const chunk = paths.slice(i, i + CONCURRENCY);
    const entries = await Promise.all(
      chunk.map(async (path) => {
        try {
          const { data, headers } = await octokit.repos.listCommits({
            owner,
            repo,
            sha: branch || undefined,
            path,
            since: since.toISOString(),
            per_page: 100,
          });

          if (!data || data.length === 0) return null;

          // Count from Link header if paginated, else data length
          const link = headers?.link ?? '';
          const lastPage = /[?&]page=(\d+)>;\s*rel="last"/.exec(link)?.[1];
          const commitCount = lastPage ? Number(lastPage) * 100 : data.length;

          // Distinct authors
          const authors = new Set<string>();
          for (const c of data) {
            if (c.commit?.author?.name) authors.add(c.commit.author.name);
            if (c.author?.login) authors.add(c.author.login);
          }

          const lastCommit = data[0];
          const lastModified =
            lastCommit?.commit?.author?.date ??
            lastCommit?.commit?.committer?.date ??
            new Date().toISOString();

          return { path, commitCount, authorCount: authors.size, lastModified };
        } catch (err) {
          const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : undefined;
          if (status !== 403 && status !== 429) {
            console.error(`[churn-service] Failed to fetch churn for ${path}:`, err instanceof Error ? err.message : String(err));
          }
          return null;
        }
      }),
    );

    for (const entry of entries) {
      if (!entry) continue;
      result[entry.path] = {
        commitCount: entry.commitCount,
        authorCount: entry.authorCount,
        lastModified: entry.lastModified,
        churnScore: 0, // normalized later
      };
    }

    // Warn if an entire batch failed — possible auth/rate-limit issue
    if (chunk.length > 0 && entries.every((e) => e === null)) {
      console.error(`[churn-service] All ${chunk.length} paths in batch failed for ${owner}/${repo} — possible auth/rate-limit issue`);
    }
  }

  // Normalize churnScore: find max commit count
  const maxCommits = Math.max(1, ...Object.values(result).map((d) => d.commitCount));
  for (const data of Object.values(result)) {
    data.churnScore = +(data.commitCount / maxCommits).toFixed(4);
  }

  cache.set(cacheKey, result);
  return result;
}
