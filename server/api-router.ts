import { z } from 'zod';
import { getOctokit } from './github/client';
import { parseRepoParams } from './github/parse-url';
import type { RequestContext } from './utils/context';
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
import { logApi, logError } from './utils/logger';
import { clearAllCaches } from './cache/lru';
import { getPublicAppConfig } from './config/app-config';
import { toErrorPayload, AppError } from './utils/errors';
import type {
  RepoAnalysis,
  TrendingRepo,
  AIExplainResponse,
  AIArchitectureResponse,
  AISuggestFilesResponse,
  AIOnboardingResponse,
  AILearningPathResponse,
  AIExplainNewResponse,
  AIRefactorResponse,
  AIHealthResponse,
  AIMermaidResponse,
  AIRoastResponse,
  AIReadmeEnhanceResponse,
} from '../src/types';

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

    if (pathname === '/api/repo/analyze' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = analyzeBodySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'Invalid request body', 'VALIDATION_ERROR', false, parsed.error.flatten());
      }
      const repo = parseRepoParams(parsed.data.owner, parsed.data.repo, parsed.data.url);
      if (!repo) {
        throw new AppError(400, 'Invalid GitHub repository URL', 'INVALID_PARAMS');
      }
      const analysis: RepoAnalysis = await analyzeRepository({ ...repo, branch: parsed.data.branch }, ctx);
      logApi('/api/repo/analyze', {
        durationMs: Date.now() - start,
        repo: `${repo.owner}/${repo.repo}`,
        branch: parsed.data.branch || 'default',
      });
      return Response.json(analysis, { status: 200 });
    }

    if (pathname === '/api/repo/branches' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const branches: { name: string; protected: boolean }[] = await fetchRepoBranches(q.data.owner, q.data.repo, ctx);
      return Response.json(branches, { status: 200 });
    }

    if (pathname === '/api/repo/graph' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const analysis: RepoAnalysis = await analyzeRepository(q.data, ctx);
      return Response.json({ graph: analysis.graph, meta: analysis.meta }, { status: 200 });
    }

    if (pathname === '/api/repo/tree' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const analysis: RepoAnalysis = await analyzeRepository(q.data, ctx);
      return Response.json({
        tree: analysis.tree,
        truncated: analysis.treeTruncated,
        importantFiles: analysis.importantFiles,
      }, { status: 200 });
    }

    if (pathname === '/api/repo/file' && method === 'GET') {
      const q = fileQuerySchema.safeParse(query);
      if (!q.success) {
        throw new AppError(400, 'owner, repo, and path required', 'INVALID_PARAMS');
      }
      const file: { content: string } = await getRepoFileContent(q.data.owner, q.data.repo, q.data.path, q.data.branch, ctx);
      return Response.json(file, { status: 200 });
    }

    if (pathname === '/api/repo/contributors' && method === 'GET') {
      const q = repoQuerySchema.safeParse(query);
      if (!q.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const analysis: RepoAnalysis = await analyzeRepository(q.data, ctx);
      return Response.json({ contributors: analysis.contributors }, { status: 200 });
    }

    if (pathname === '/api/ai/explain' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = aiExplainSchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'Invalid request', 'VALIDATION_ERROR', false, parsed.error.flatten());
      }
      const result: AIExplainResponse = await explainRepo({ ...parsed.data, apiKey: userKey, gitHubToken }, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/architecture' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIArchitectureResponse = await explainArchitecture(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/suggest-files' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AISuggestFilesResponse = await suggestFiles(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/onboarding' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIOnboardingResponse = await generateOnboarding(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/learning-path' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AILearningPathResponse = await generateLearningPath(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/explain-new' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIExplainNewResponse = await explainRepoELI5(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/refactor' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIRefactorResponse = await generateRefactorSuggestions(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/health' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIHealthResponse = await generateHealthReport(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/mermaid' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIMermaidResponse = await generateMermaidDiagram(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/roast' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIRoastResponse = await generateRepoRoast(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    if (pathname === '/api/ai/readme-enhance' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const parsed = repoQuerySchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
      }
      const result: AIReadmeEnhanceResponse = await generateReadmeEnhancement(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
      return Response.json(result, { status: 200 });
    }

    return null;
  } catch (error) {
    const payload = toErrorPayload(error);
    logError(pathname, error, { durationMs: Date.now() - start });
    return Response.json(payload, { status: payload.status });
  }
}
