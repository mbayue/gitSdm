import { getOctokit } from './github/client';
import type { RequestContext } from './utils/context';
import { fetchTrending } from './services/trending';
import { logApi, logError } from './utils/logger';
import { clearAllCaches } from './cache/lru';
import { getPublicAppConfig } from './config/app-config';
import { toErrorPayload } from './utils/errors';
import type { TrendingRepo } from '../src/types';

// Decoupled Router Submodules
import { handleAiRoutes } from './router/ai-routes';
import { handleRepoRoutes } from './router/repo-routes';
import { handleSearchRoutes } from './router/search-routes';

export async function handleApiRequest(
  req: Request,
): Promise<Response | null> {
  const start = Date.now();
  const method = req.method;
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Convert search params to a record for validation
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const userKey = req.headers.get('x-gemini-api-key') || undefined;
  const gitHubToken = req.headers.get('x-github-token') || undefined;

  const ctx: RequestContext = {
    octokit: getOctokit(gitHubToken),
  };

  try {
    // ── Global System Utilities ─────────────────────────────────────
    if (pathname === '/api/trending' && method === 'GET') {
      const repos: TrendingRepo[] = await fetchTrending();
      logApi('/api/trending', { durationMs: Date.now() - start, count: repos.length });
      return Response.json({ repos }, { status: 200 });
    }

    if (pathname === '/api/config' && method === 'GET') {
      return Response.json(getPublicAppConfig(), { status: 200 });
    }

    if (pathname === '/api/cache/clear' && method === 'POST') {
      clearAllCaches();
      logApi('/api/cache/clear', { durationMs: Date.now() - start });
      return Response.json({ cleared: true }, { status: 200 });
    }

    // ── Repository Routes ───────────────────────────────────────────
    const repoResponse = await handleRepoRoutes(pathname, req, query, ctx, start);
    if (repoResponse) return repoResponse;

    // ── AI Summary & Analysis Routes ────────────────────────────────
    const aiResponse = await handleAiRoutes(pathname, req, userKey, gitHubToken, ctx);
    if (aiResponse) return aiResponse;

    // ── Semantic Search & Ingest Routes ─────────────────────────────
    const searchResponse = await handleSearchRoutes(pathname, req, query, userKey, ctx, start);
    if (searchResponse) return searchResponse;

    return null;
  } catch (error) {
    const payload = toErrorPayload(error);
    logError(pathname, error, { durationMs: Date.now() - start });
    return Response.json(payload, { status: payload.status });
  }
}
