import type { RequestContext } from '../utils/context';
import { AppError } from '../utils/errors';
import { analyzeBodySchema, repoQuerySchema, fileQuerySchema } from './schemas';
import { analyzeRepository } from '../services/analyze-repo';
import { fetchRepoBranches, fetchContributors, fetchRepoTags } from '../github/fetch-tree';
import { getRepoFileContent } from '../services/get-file';
import { parseRepoParams } from '../github/parse-url';
import { logApi } from '../utils/logger';
import type { RepoAnalysis } from '../../src/types';

export async function handleRepoRoutes(
  pathname: string,
  req: Request,
  query: Record<string, string>,
  ctx: RequestContext,
  start: number,
): Promise<Response | null> {
  if (pathname === '/api/repo/analyze') {
    const body = await req.json().catch(() => ({}));
    const parsed = analyzeBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid request body', 'VALIDATION_ERROR', false, parsed.error.flatten());
    }
    const repo = parseRepoParams(parsed.data.owner, parsed.data.repo, parsed.data.url);
    if (!repo) {
      throw new AppError(400, 'Invalid GitHub repository URL', 'INVALID_PARAMS');
    }
    const validated = repoQuerySchema.safeParse(repo);
    if (!validated.success) {
      throw new AppError(400, 'Invalid owner/repo identifiers', 'INVALID_PARAMS');
    }
    const analysis: RepoAnalysis = await analyzeRepository({ ...repo, branch: parsed.data.branch }, ctx);
    logApi('/api/repo/analyze', {
      durationMs: Date.now() - start,
      repo: `${repo.owner}/${repo.repo}`,
      branch: parsed.data.branch || 'default',
    });
    return Response.json(analysis, { status: 200 });
  }

  if (pathname === '/api/repo/branches') {
    const q = repoQuerySchema.safeParse(query);
    if (!q.success) {
      throw new AppError(400, 'Invalid owner/repo', 'INVALID_PARAMS');
    }
    const branches = await fetchRepoBranches(q.data.owner, q.data.repo, ctx);
    return Response.json(branches, { status: 200 });
  }

  if (pathname === '/api/repo/tags') {
    const q = repoQuerySchema.safeParse(query);
    if (!q.success) {
      throw new AppError(400, 'Invalid owner/repo', 'INVALID_PARAMS');
    }
    const tags = await fetchRepoTags(q.data.owner, q.data.repo, ctx);
    return Response.json(tags, { status: 200 });
  }

  if (pathname === '/api/repo/graph') {
    const q = repoQuerySchema.safeParse(query);
    if (!q.success) {
      throw new AppError(400, 'Invalid owner/repo', 'INVALID_PARAMS');
    }
    const analysis: RepoAnalysis = await analyzeRepository(q.data, ctx);
    return Response.json({ graph: analysis.graph, meta: analysis.meta }, { status: 200 });
  }

  if (pathname === '/api/repo/tree') {
    const q = repoQuerySchema.safeParse(query);
    if (!q.success) {
      throw new AppError(400, 'Invalid owner/repo', 'INVALID_PARAMS');
    }
    const analysis: RepoAnalysis = await analyzeRepository(q.data, ctx);
    return Response.json({
      tree: analysis.tree,
      truncated: analysis.treeTruncated,
      importantFiles: analysis.importantFiles,
    }, { status: 200 });
  }

  if (pathname === '/api/repo/file') {
    const q = fileQuerySchema.safeParse(query);
    if (!q.success) {
      throw new AppError(400, 'Invalid owner, repo, or path', 'INVALID_PARAMS');
    }
    const file: { content: string } = await getRepoFileContent(q.data.owner, q.data.repo, q.data.path, q.data.branch, ctx);
    return Response.json(file, { status: 200 });
  }

  if (pathname === '/api/repo/contributors') {
    const q = repoQuerySchema.safeParse(query);
    if (!q.success) {
      throw new AppError(400, 'Invalid owner/repo', 'INVALID_PARAMS');
    }
    const contributors = await fetchContributors(q.data.owner, q.data.repo, ctx);
    return Response.json({ contributors }, { status: 200 });
  }

  return null;
}
