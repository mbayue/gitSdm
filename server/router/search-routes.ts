import type { RequestContext } from '../utils/context';
import { AppError } from '../utils/errors';
import { searchBodySchema, askBodySchema, indexBodySchema, repoQuerySchema } from './schemas';
import { fetchRepoInfo } from '../github/fetch-tree';
import { getSearchEngine } from '../search/search-engine';
import { getQAEngine } from '../search/qa-engine';
import { getIndexingPipeline } from '../search/indexing-pipeline';
import { logApi } from '../utils/logger';
import { searchIndexKey, indexRequestKey } from '../search/index-identity';
import { indexRequests } from '../search/index-requests';
import { hashContext } from '../cache/lru';

export async function handleSearchRoutes(
  pathname: string,
  req: Request,
  query: Record<string, string>,
  userKey: string | undefined,
  ctx: RequestContext,
  start: number,
): Promise<Response | null> {
  if (pathname === '/api/search') {
    const body = await req.json().catch(() => ({}));
    const parsed = searchBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid search request', 'VALIDATION_ERROR', false, parsed.error.flatten());
    }
    const info = await fetchRepoInfo(parsed.data.owner, parsed.data.repo, parsed.data.branch, ctx);
    const engine = getSearchEngine();
    const result = await engine.search({
      query: parsed.data.query,
      owner: parsed.data.owner,
      repo: parsed.data.repo,
      commitSha: info.sha,
      gitHubToken: ctx.gitHubToken,
      includePaths: parsed.data.includePaths,
      excludePaths: parsed.data.excludePaths,
    });
    logApi('/api/search', {
      durationMs: Date.now() - start,
      results: result.results.length,
    });
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/search/ask') {
    const body = await req.json().catch(() => ({}));
    const parsed = askBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid ask request', 'VALIDATION_ERROR', false, parsed.error.flatten());
    }
    const info = await fetchRepoInfo(parsed.data.owner, parsed.data.repo, parsed.data.branch, ctx);
    const qaEngine = getQAEngine();
    const result = await qaEngine.ask({
      question: parsed.data.question,
      owner: parsed.data.owner,
      repo: parsed.data.repo,
      commitSha: info.sha,
      apiKey: userKey,
      gitHubToken: ctx.gitHubToken,
      includePaths: parsed.data.includePaths,
      excludePaths: parsed.data.excludePaths,
    });
    logApi('/api/search/ask', {
      durationMs: Date.now() - start,
      citations: result.citations.length,
    });
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/search/index' || pathname === '/api/search/cancel') {
    const body = await req.json().catch(() => ({}));
    const parsed = indexBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid index request', 'VALIDATION_ERROR', false, parsed.error.flatten());
    }
    const requestKey = parsed.data.buildId
      ? indexRequestKey(parsed.data.owner, parsed.data.repo, parsed.data.buildId, ctx)
      : undefined;
    if (pathname === '/api/search/cancel' && requestKey) {
      indexRequests.cancel(requestKey);
      return Response.json({ state: 'idle' });
    }
    const legacyKey = indexRequestKey(
      parsed.data.owner,
      parsed.data.repo,
      hashContext(JSON.stringify([parsed.data.branch, parsed.data.includePaths, parsed.data.excludePaths])),
      ctx,
    );
    if (pathname === '/api/search/cancel' && !requestKey) {
      // Legacy builds carry no buildId: cancelPending misses once the registry
      // entry settles, so remove the registration and fall through to the
      // pipeline cancel below instead of leaking it.
      if (indexRequests.cancelPending(legacyKey)) return Response.json({ state: 'idle' });
      indexRequests.cancel(legacyKey);
    }
    const registration =
      pathname === '/api/search/index' ? indexRequests.begin(requestKey ?? legacyKey, parsed.data.buildId) : undefined;
    let resumable = false;
    try {
      if (registration?.cancelled()) return Response.json({ state: 'idle' });
      const info = await fetchRepoInfo(parsed.data.owner, parsed.data.repo, parsed.data.branch, ctx);
      if (registration?.cancelled()) return Response.json({ state: 'idle' });
      const pipeline = getIndexingPipeline();
      const snapshotKey = searchIndexKey(
        parsed.data.owner,
        parsed.data.repo,
        info.sha,
        ctx,
        parsed.data.includePaths,
        parsed.data.excludePaths,
      );
      if (pathname === '/api/search/index' && pipeline.getStatus(snapshotKey).state === 'indexing')
        throw new AppError(409, 'Indexing is already in progress.', 'INDEXING_IN_PROGRESS');
      registration?.attach(snapshotKey, () => pipeline.cancelIndexing(snapshotKey));
      if (pathname === '/api/search/cancel') {
        const key = searchIndexKey(
          parsed.data.owner,
          parsed.data.repo,
          info.sha,
          ctx,
          parsed.data.includePaths,
          parsed.data.excludePaths,
        );
        pipeline.cancelIndexing(key);
        return Response.json(pipeline.getStatus(key));
      }

      try {
        await pipeline.startIndexing(
          {
            owner: parsed.data.owner,
            repo: parsed.data.repo,
            branch: parsed.data.branch,
            commitSha: info.sha,
            includePaths: parsed.data.includePaths,
            excludePaths: parsed.data.excludePaths,
          },
          ctx,
        );
      } catch (err) {
        if (err instanceof AppError && err.status === 409) {
          return Response.json({ status: 'rejected', error: 'Indexing already in progress' }, { status: 409 });
        }
        throw err;
      } finally {
        resumable = pipeline.getStatus(snapshotKey).state === 'paused';
      }

      logApi('/api/search/index', {
        durationMs: Date.now() - start,
        repo: `${parsed.data.owner}/${parsed.data.repo}`,
      });
      return Response.json(
        pipeline.getStatus(
          searchIndexKey(
            parsed.data.owner,
            parsed.data.repo,
            info.sha,
            ctx,
            parsed.data.includePaths,
            parsed.data.excludePaths,
          ),
        ),
        {
          status: 200,
        },
      );
    } finally {
      registration?.finish(resumable, !!requestKey);
    }
  }

  if (pathname === '/api/search/status') {
    const parsed = repoQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo query params required', 'INVALID_PARAMS');
    }
    const { owner, repo, branch } = parsed.data;
    const pipeline = getIndexingPipeline();
    const info = await fetchRepoInfo(owner, repo, branch, ctx);
    const includePaths = splitPaths(query.includePaths);
    const excludePaths = splitPaths(query.excludePaths);
    const status = pipeline.getStatus(searchIndexKey(owner, repo, info.sha, ctx, includePaths, excludePaths));
    return Response.json(
      {
        ...status,
        buildId: indexRequests.buildId(searchIndexKey(owner, repo, info.sha, ctx, includePaths, excludePaths)),
      },
      { status: 200 },
    );
  }

  return null;
}

function splitPaths(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // legacy comma-separated string
  }
  return value.split(',').filter(Boolean);
}
