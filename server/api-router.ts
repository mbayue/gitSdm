import { getOctokit } from './github/client';
import type { RequestContext } from './utils/context';
import { fetchTrending } from './services/trending';
import { logApi, logError } from './utils/logger';
import { getPublicAppConfig } from './config/app-config';
import { toErrorPayload } from './utils/errors';
import type { TrendingRepo } from '../src/types';

// Decoupled Router Submodules
import { handleAiRoutes } from './router/ai-routes';
import { handleRepoRoutes } from './router/repo-routes';
import { handleSearchRoutes } from './router/search-routes';
import { addSecurityHeaders } from './utils/http';
import { createAdmissionLimit, limitRequestBody } from './utils/request-limits';

const admitRequest = createAdmissionLimit();

export async function handleApiRequest(req: Request): Promise<Response | null> {
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
    gitHubToken,
  };

  const expensive =
    pathname.startsWith('/api/ai/') || pathname.startsWith('/api/search/') || pathname.startsWith('/api/repo/');
  const release = expensive ? admitRequest() : undefined;
  if (release === null) {
    return addSecurityHeaders(
      Response.json(
        {
          error: 'Server is busy. Please try again shortly.',
          code: 'RATE_LIMIT_EXCEEDED',
          status: 429,
          retryable: true,
        },
        { status: 429, headers: { 'Retry-After': '60' } },
      ),
    );
  }
  try {
    req = await limitRequestBody(req);
    // ── Global System Utilities ─────────────────────────────────────
    if (pathname === '/api/trending' && method === 'GET') {
      const repos: TrendingRepo[] = await fetchTrending();
      logApi('/api/trending', {
        durationMs: Date.now() - start,
        count: repos.length,
      });
      return addSecurityHeaders(Response.json({ repos }, { status: 200 }));
    }

    if (pathname === '/api/config' && method === 'GET') {
      return addSecurityHeaders(Response.json(getPublicAppConfig(), { status: 200 }));
    }

    // ── Repository Routes ───────────────────────────────────────────
    const repoResponse = await handleRepoRoutes(pathname, req, query, ctx, start);
    if (repoResponse) return addSecurityHeaders(repoResponse);

    // ── AI Summary & Analysis Routes ────────────────────────────────
    const aiResponse = await handleAiRoutes(pathname, req, userKey, gitHubToken, ctx);
    if (aiResponse) return addSecurityHeaders(aiResponse);

    // ── Semantic Search & Ingest Routes ─────────────────────────────
    const searchResponse = await handleSearchRoutes(pathname, req, query, userKey, ctx, start);
    if (searchResponse) return addSecurityHeaders(searchResponse);

    return null;
  } catch (error) {
    const payload = toErrorPayload(error);
    logError(pathname, error, { durationMs: Date.now() - start });
    return addSecurityHeaders(Response.json(payload, { status: payload.status }));
  } finally {
    release?.();
  }
}
