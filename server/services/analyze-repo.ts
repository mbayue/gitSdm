import { analyzeCacheKey, cache } from '../cache/lru';
import {
  buildTreeFromPaths,
  fetchContributors,
  fetchFileContents,
  fetchFlatTree,
  fetchRepoInfo,
  fetchTimeline,
  findManifestPaths,
} from '../github/fetch-tree';
import { parseGitHubUrl } from '../github/parse-url';
import { buildGraph } from '../graph/graph-builder';
import { analyzeDependencies } from '../parser/dependency-analyzer';
import { annotateTree, findImportantFiles } from '../parser/file-classifier';
import type { RepoAnalysis } from '../../src/types';

export async function analyzeRepository(
  input: string | { owner: string; repo: string; branch?: string },
): Promise<RepoAnalysis> {
  const parsed =
    typeof input === 'string'
      ? parseGitHubUrl(input)
      : input;

  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  const { owner, repo } = parsed;
  const branch = typeof parsed === 'object' && 'branch' in parsed ? (parsed as any).branch as string | undefined : undefined;
  const info = await fetchRepoInfo(owner, repo, branch);
  const cacheKey = analyzeCacheKey(owner, repo, info.sha);

  const cached = cache.get<RepoAnalysis>(cacheKey);
  if (cached) return cached;

  const [{ items, truncated }, contributors, timeline] = await Promise.all([
    fetchFlatTree(owner, repo, info.sha),
    fetchContributors(owner, repo),
    fetchTimeline(owner, repo),
  ]);

  const tree = annotateTree(buildTreeFromPaths(items));
  const manifestPaths = findManifestPaths(items);
  const fileContents = await fetchFileContents(owner, repo, manifestPaths, info.sha);
  const dependencies = analyzeDependencies(fileContents);
  const importantFiles = findImportantFiles(items.map((i) => i.path));

  const graph = buildGraph({
    owner,
    repo,
    tree,
    dependencies,
    contributors,
  });

  const analysis: RepoAnalysis = {
    meta: {
      owner,
      repo,
      fullName: info.fullName,
      description: info.description,
      stars: info.stars,
      forks: info.forks,
      language: info.language,
      defaultBranch: info.defaultBranch,
      sha: info.sha,
      url: info.url,
      topics: info.topics,
      license: info.license,
      createdAt: info.createdAt,
      updatedAt: info.updatedAt,
    },
    tree,
    treeTruncated: truncated,
    dependencies,
    graph,
    contributors,
    timeline,
    importantFiles,
  };

  cache.set(cacheKey, analysis);
  return analysis;
}
