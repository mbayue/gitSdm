import type { RequestContext } from '../utils/context';
import { AppError } from '../utils/errors';
import { aiExplainSchema, repoQuerySchema } from './schemas';
import {
  explainRepo,
  generateLearningPath,
  explainRepoELI5,
  generateRefactorSuggestions,
  generateHealthReport,
  generateMermaidDiagram,
  generateRepoRoast,
  generateReadmeEnhancement,
} from '../ai/summarizer';
import type {
  AIExplainResponse,
  AILearningPathResponse,
  AIExplainLifResponse,
  AIRefactorResponse,
  AIHealthResponse,
  AIMermaidResponse,
  AIRoastResponse,
  AIReadmeEnhanceResponse,
} from '../../src/types';

export async function handleAiRoutes(
  pathname: string,
  req: Request,
  userKey: string | undefined,
  gitHubToken: string | undefined,
  ctx: RequestContext,
): Promise<Response | null> {
  if (pathname === '/api/ai/explain') {
    const body = await req.json().catch(() => ({}));
    const parsed = aiExplainSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid request', 'VALIDATION_ERROR', false, parsed.error.flatten());
    }
    const result: AIExplainResponse = await explainRepo({ ...parsed.data, apiKey: userKey, gitHubToken }, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/learning-path') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AILearningPathResponse = await generateLearningPath(parsed.data.owner, parsed.data.repo, parsed.data.branch, parsed.data.goal, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/explain-lif') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AIExplainLifResponse = await explainRepoELI5(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/refactor') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AIRefactorResponse = await generateRefactorSuggestions(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/health') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AIHealthResponse = await generateHealthReport(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/mermaid') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AIMermaidResponse = await generateMermaidDiagram(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/roast') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AIRoastResponse = await generateRepoRoast(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  if (pathname === '/api/ai/readme-enhance') {
    const body = await req.json().catch(() => ({}));
    const parsed = repoQuerySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'owner and repo required', 'INVALID_PARAMS');
    }
    const result: AIReadmeEnhanceResponse = await generateReadmeEnhancement(parsed.data.owner, parsed.data.repo, parsed.data.branch, userKey, gitHubToken, ctx);
    return Response.json(result, { status: 200 });
  }

  return null;
}
