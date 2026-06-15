import type { RequestContext } from '../utils/context';
import { AppError } from '../utils/errors';
import { searchBodySchema, askBodySchema, indexBodySchema } from './schemas';
import { fetchRepoInfo } from '../github/fetch-tree';
import { getSearchEngine } from '../search/search-engine';
import { getQAEngine } from '../search/qa-engine';
import { getIndexingPipeline } from '../search/indexing-pipeline';
import { logApi } from '../utils/logger';

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
    });
    logApi('/api/search', { durationMs: Date.now() - start, results: result.results.length });
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
    });
    logApi('/api/search/ask', { durationMs: Date.now() - start, citations: result.citations.length });
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/search/index') {
    const body = await req.json().catch(() => ({}));
    const parsed = indexBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid index request', 'VALIDATION_ERROR', false, parsed.error.flatten());
    }
    const info = await fetchRepoInfo(parsed.data.owner, parsed.data.repo, parsed.data.branch, ctx);
    const pipeline = getIndexingPipeline();
    // Fire-and-forget background indexing pipeline
    try {
      await pipeline.startIndexing({
        owner: parsed.data.owner,
        repo: parsed.data.repo,
        branch: parsed.data.branch,
        commitSha: info.sha,
      }, ctx);
    } catch (err) {
      if (err instanceof AppError && err.status === 409) {
        return Response.json({ status: 'rejected', error: 'Indexing already in progress' }, { status: 409 });
      }
      throw err;
    }

    logApi('/api/search/index', { durationMs: Date.now() - start, repo: `${parsed.data.owner}/${parsed.data.repo}` });
    return Response.json({ status: 'started' }, { status: 200 });
  }

  if (pathname === '/api/search/status') {
    const owner = query.owner;
    const repo = query.repo;
    if (!owner || !repo) {
      throw new AppError(400, 'owner and repo query params required', 'INVALID_PARAMS');
    }
    const pipeline = getIndexingPipeline();
    const status = pipeline.getStatus(`${owner}/${repo}`);
    return Response.json(status, { status: 200 });
  }

  return null;
}
