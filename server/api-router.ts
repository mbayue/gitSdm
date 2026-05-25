import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { GitHubRateLimitError } from './github/client';
import { parseRepoParams } from './github/parse-url';
import {
  explainArchitecture,
  explainRepo,
  generateOnboarding,
  suggestFiles,
  explainRepoELI5,
  generateRefactorSuggestions,
  generateHealthReport,
  generateMermaidDiagram,
  generateRepoRoast,
  generateReadmeEnhancement,
  generateLearningPath,
} from './ai/summarizer';
import { analyzeRepository } from './services/analyze-repo';
import { getRepoFileContent } from './services/get-file';
import { fetchTrending } from './services/trending';
import { fetchRepoBranches } from './github/fetch-tree';
import { logApi } from './utils/logger';
import { parseQuery, readBody, sendError, sendJson } from './utils/http';

async function getRequestBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return req.body;
  return readBody(req);
}

const analyzeBodySchema = z.object({
  url: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  branch: z.string().optional(),
});

const aiExplainSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
  sha: z.string().optional(),
  scope: z.enum(['repo', 'node', 'file']).default('repo'),
  nodeId: z.string().optional(),
  filePath: z.string().optional(),
  fileSnippet: z.string().optional(),
  context: z.string().optional(),
});

const repoQuerySchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
});

const fileQuerySchema = repoQuerySchema.extend({
  path: z.string().min(1).max(500),
});

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<boolean> {
  const start = Date.now();
  const method = req.method ?? 'GET';
  const query = parseQuery(req.url ?? '');

  try {
    if (pathname === '/api/trending' && method === 'GET') {
      const repos = await fetchTrending();
      logApi('/api/trending', { durationMs: Date.now() - start, count: repos.length });
      sendJson(res, 200, { repos });
      return true;
    }

    if (pathname === '/api/repo/analyze' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = analyzeBodySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'Invalid request body', parsed.error.flatten());
        return true;
      }
      const repo = parseRepoParams(parsed.data.owner, parsed.data.repo, parsed.data.url);
      if (!repo) {
        sendError(res, 400, 'Invalid GitHub repository URL');
        return true;
      }
      const analysis = await analyzeRepository({ ...repo, branch: parsed.data.branch });
      logApi('/api/repo/analyze', {
        durationMs: Date.now() - start,
        repo: `${repo.owner}/${repo.repo}`,
        branch: parsed.data.branch || 'default',
      });
      sendJson(res, 200, analysis);
      return true;
    }

    if (pathname === '/api/repo/branches' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const branches = await fetchRepoBranches(q.data.owner, q.data.repo);
      sendJson(res, 200, branches);
      return true;
    }

    if (pathname === '/api/repo/graph' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const analysis = await analyzeRepository(q.data);
      sendJson(res, 200, { graph: analysis.graph, meta: analysis.meta });
      return true;
    }

    if (pathname === '/api/repo/tree' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const analysis = await analyzeRepository(q.data);
      sendJson(res, 200, {
        tree: analysis.tree,
        truncated: analysis.treeTruncated,
        importantFiles: analysis.importantFiles,
      });
      return true;
    }

    if (pathname === '/api/repo/file' && method === 'GET') {
      const q = fileQuerySchema.safeParse(query);
      if (!q.success) {
        sendError(res, 400, 'owner, repo, and path required');
        return true;
      }
      const file = await getRepoFileContent(q.data.owner, q.data.repo, q.data.path, q.data.branch);
      sendJson(res, 200, file);
      return true;
    }

    if (pathname === '/api/repo/contributors' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const analysis = await analyzeRepository(q.data);
      sendJson(res, 200, { contributors: analysis.contributors });
      return true;
    }

    if (pathname === '/api/ai/explain' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = aiExplainSchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'Invalid request', parsed.error.flatten());
        return true;
      }
      const result = await explainRepo(parsed.data);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/architecture' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await explainArchitecture(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/suggest-files' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await suggestFiles(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/onboarding' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateOnboarding(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/learning-path' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateLearningPath(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/explain-new' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await explainRepoELI5(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/refactor' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateRefactorSuggestions(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/health' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateHealthReport(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/mermaid' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateMermaidDiagram(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/roast' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateRepoRoast(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/readme-enhance' && method === 'POST') {
      const body = await getRequestBody(req);
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        sendError(res, 400, 'owner and repo required');
        return true;
      }
      const result = await generateReadmeEnhancement(parsed.data.owner, parsed.data.repo, parsed.data.branch);
      sendJson(res, 200, result);
      return true;
    }

    return false;
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      res.setHeader('Retry-After', String(error.retryAfter ?? 60));
      sendError(res, 429, error.message);
      return true;
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    logApi(pathname, { durationMs: Date.now() - start, error: message });
    sendError(res, 500, message);
    return true;
  }
}
