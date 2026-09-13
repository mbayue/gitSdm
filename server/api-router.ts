import { chatOverrides, readChatOverrides } from './ai/chat-config';
import { getOctokit } from './github/client';
import type { RequestContext } from './utils/context';
import { fetchTrending } from './services/trending';
import { logApi, logError } from './utils/logger';
import { getPublicAppConfig } from './config/app-config';
import { AppError, toErrorPayload } from './utils/errors';
import type { TrendingRepo } from '../src/types';

// Decoupled Router Submodules
import { handleAiRoutes } from './router/ai-routes';
import { handleRepoRoutes } from './router/repo-routes';
import { handleSearchRoutes } from './router/search-routes';
import { addSecurityHeaders } from './utils/http';
import { configuredLimit, reserveUsage } from './utils/usage-limits';
import { createAdmissionLimit, limitRequestBody } from './utils/request-limits';
import { limitClient } from './utils/client-limits';

const admitRequest = createAdmissionLimit(8, Infinity);
const admitConnection = createAdmissionLimit(8, Infinity);

export async function handleApiRequest(req: Request, remoteAddress?: string): Promise<Response | null> {
  const start = Date.now();
  const method = req.method;
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Convert search params to a record for validation
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const userKey = req.headers.get('x-ai-api-key')?.trim() || req.headers.get('x-gemini-api-key')?.trim() || undefined;
  const gitHubToken = req.headers.get('x-github-token') || undefined;

  const ctx: RequestContext = {
    octokit: getOctokit(gitHubToken),
    gitHubToken,
  };

  const expensive =
    pathname === '/api/trending' ||
    pathname.startsWith('/api/ai/') ||
    pathname === '/api/search' ||
    pathname.startsWith('/api/search/') ||
    pathname.startsWith('/api/repo/');
  let release: (() => void) | null | undefined;
  let releaseConnection: (() => void) | null | undefined;
  try {
    releaseConnection = expensive ? admitConnection() : undefined;
    if (releaseConnection === null)
      throw new AppError(429, 'Server is busy. Please try again shortly.', 'RATE_LIMIT_EXCEEDED', true);
    if (expensive) await limitClient(req.headers, remoteAddress);
    release = expensive ? admitRequest() : undefined;
    if (release === null)
      throw new AppError(429, 'Server is busy. Please try again shortly.', 'RATE_LIMIT_EXCEEDED', true);
    if (expensive) await reserveUsage('api-minute', 1, configuredLimit('API_REQUESTS_PER_MINUTE', 600), 60000);
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
    const aiResponse = await chatOverrides.run(readChatOverrides(req.headers, userKey), () =>
      handleAiRoutes(pathname, req, userKey, gitHubToken, ctx),
    );
    if (aiResponse) return addSecurityHeaders(aiResponse);

    // ── Semantic Search & Ingest Routes ─────────────────────────────
    const searchResponse = await chatOverrides.run(
      pathname === '/api/search/ask' ? readChatOverrides(req.headers, userKey) : {},
      () => handleSearchRoutes(pathname, req, query, userKey, ctx, start),
    );
    if (searchResponse) return addSecurityHeaders(searchResponse);

    return null;
  } catch (error) {
    const payload = toErrorPayload(error);
    logError(pathname, error, { durationMs: Date.now() - start });
    return addSecurityHeaders(
      Response.json(payload, {
        status: payload.status,
        headers:
          payload.status === 429 ? { 'Retry-After': String(payload.context?.retryAfterSeconds ?? 60) } : undefined,
      }),
    );
  } finally {
    release?.();
    releaseConnection?.();
  }
}
