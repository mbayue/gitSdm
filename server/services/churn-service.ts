import { createHash } from 'node:crypto';
import { cache, churnCacheKey } from '../cache/lru';
import { getOctokit } from '../github/client';
import { isMockRepo, fetchMockChurn } from '../github/mock-data';
import type { RequestContext } from '../utils/context';
import type { ChurnResponse, ChurnContinuation, FileChurnData } from '../../src/types/churn';
export type { FileChurnData } from '../../src/types/churn';

type Failure = ChurnResponse['failures'][string];
type Stored = {
  files: Record<string, FileChurnData>;
  failures: Record<string, Failure>;
};
const inFlight = new Map<string, Promise<void>>();

/** Credential-scoped cached results plus explicit continuation work across server instances. */
export async function fetchRepoChurn(
  owner: string,
  repo: string,
  inputPaths: string[],
  branch?: string,
  tokenOrCtx?: string | RequestContext,
  days = 90,
  continuation: ChurnContinuation = {},
): Promise<ChurnResponse> {
  const paths = [...new Set(inputPaths)].slice(0, 200);
  if (isMockRepo(owner))
    return {
      files: await fetchMockChurn(paths),
      checked: paths.length,
      total: paths.length,
      complete: true,
      remaining: [],
      failures: {},
    };
  const token = typeof tokenOrCtx === 'string' ? tokenOrCtx : tokenOrCtx?.gitHubToken;
  const scope = createHash('sha256')
    .update(token || process.env.GITHUB_TOKEN || 'anonymous')
    .digest('hex');
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);
  const key = `${churnCacheKey(owner, repo, branch, days)}:incremental:${since.toISOString()}:${scope}`;
  const state = cache.get<Stored>(key) ?? { files: {}, failures: {} };
  cache.set(key, state);
  const completed = new Set((continuation.completed ?? []).filter((path) => paths.includes(path)));
  const order = [...new Set([...(continuation.pending ?? []).filter((path) => paths.includes(path)), ...paths])];
  const pending = order
    .filter(
      (path) =>
        (!continuation.pending || continuation.pending.includes(path)) &&
        !completed.has(path) &&
        !state.files[path] &&
        !(state.failures[path]?.retryAt > Date.now()),
    )
    .slice(0, 7);
  const octokit = tokenOrCtx && typeof tokenOrCtx === 'object' ? tokenOrCtx.octokit : getOctokit(tokenOrCtx);
  await Promise.all(
    pending.map((path) => {
      const flightKey = `${key}:${path}`;
      const existing = inFlight.get(flightKey);
      if (existing) return existing;
      const task = (async () => {
        try {
          const { data, headers } = await octokit.repos.listCommits({
            owner,
            repo,
            sha: branch,
            path,
            since: since.toISOString(),
            per_page: 100,
            request: { signal: AbortSignal.timeout(5000) },
          });
          const lastPage = /[?&]page=(\d+)>;\s*rel="last"/.exec(headers.link ?? '')?.[1];
          const authors = new Set(data.map((c) => c.author?.login ?? c.commit.author?.name).filter(Boolean));
          state.files[path] = {
            commitCount: lastPage ? Number(lastPage) * 100 : data.length,
            authorCount: authors.size,
            lastModified: data[0]?.commit.author?.date ?? data[0]?.commit.committer?.date ?? undefined,
            churnScore: 0,
          };
          delete state.failures[path];
        } catch (error) {
          const err = error as {
            status?: number;
            response?: { headers?: Record<string, string> };
          };
          const headers = err.response?.headers ?? {};
          const limited =
            err.status === 429 ||
            (err.status === 403 && (headers['x-ratelimit-remaining'] === '0' || !!headers['retry-after']));
          const issue = limited
            ? 'rate-limit'
            : err.status === 401 || err.status === 403 || err.status === 404
              ? 'access'
              : 'timeout-or-network';
          const seconds = Number(headers['retry-after']);
          const reset = Number(headers['x-ratelimit-reset']) * 1000;
          const retryAt = limited
            ? Math.max(
                Date.now() + 60_000,
                Number.isFinite(seconds) ? Date.now() + seconds * 1000 : 0,
                Number.isFinite(reset) ? reset : 0,
              )
            : Date.now() + 10_000;
          state.failures[path] = { issue, retryAt };
        }
      })().finally(() => inFlight.delete(flightKey));
      inFlight.set(flightKey, task);
      return task;
    }),
  );
  const entries = paths.flatMap((path) => (state.files[path] ? [[path, state.files[path]] as const] : []));
  entries.forEach(([path]) => completed.add(path));
  const remaining = order.filter((path) => !completed.has(path));
  const failures = Object.fromEntries(
    remaining.flatMap((path) => (state.failures[path] ? [[path, state.failures[path]]] : [])),
  );
  const stopped = Object.values(failures).sort((a, b) => b.retryAt - a.retryAt)[0];
  const max = Math.max(1, ...entries.map(([, file]) => file.commitCount));
  return {
    files: Object.fromEntries(entries.map(([path, file]) => [path, { ...file, churnScore: file.commitCount / max }])),
    checked: completed.size,
    total: paths.length,
    complete: remaining.length === 0,
    remaining,
    failures,
    issue: stopped?.issue,
    retryAt: stopped?.retryAt,
  };
}
