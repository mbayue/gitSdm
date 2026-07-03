import { analyzeCacheKey, cache } from '../cache/lru';
import {
  buildTreeFromPaths,
  fetchContributors,
  fetchFileContents,
  fetchFlatTree,
  fetchRepoInfo,
  fetchTimeline,
  fetchTotalCommits,
  findManifestPaths,
} from '../github/fetch-tree';
import { parseGitHubUrl } from '../github/parse-url';
import { buildGraph } from '../graph/graph-builder';
import { analyzeDependencies, analyzeManifestDependencies, analyzeWorkspacePackages } from '../parser/dependency-analyzer';
import { annotateTree, findImportantFiles } from '../parser/file-classifier';
import { analyzeAllFileComplexity } from '../parser/complexity-analyzer';
import { fetchRepoChurn } from './churn-service';
import { buildDependencyHealthReport } from './dependency-health';
import { fetchNpmDependencyMetadataBatch } from './npm-registry';
import type { RepoAnalysis } from '../../src/types';
import type { RequestContext } from '../utils/context';

export async function analyzeRepository(
  input: string | { owner: string; repo: string; branch?: string },
  tokenOrCtx?: string | RequestContext,
): Promise<RepoAnalysis> {
  const parsed =
    typeof input === 'string'
      ? parseGitHubUrl(input)
      : input;

  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  const { owner, repo } = parsed;
  const branch = typeof parsed === 'object' && 'branch' in parsed ? (parsed as { branch?: string }).branch : undefined;
  const info = await fetchRepoInfo(owner, repo, branch, tokenOrCtx);
  const cacheKey = analyzeCacheKey(owner, repo, info.sha, branch);

  const cached = cache.get<RepoAnalysis>(cacheKey);
  if (cached) return cached;

  const [{ items, truncated, totalFiles }, contributors, timeline, totalCommits] = await Promise.all([
    fetchFlatTree(owner, repo, info.sha, tokenOrCtx),
    fetchContributors(owner, repo, tokenOrCtx),
    fetchTimeline(owner, repo, branch, tokenOrCtx),
    fetchTotalCommits(owner, repo, branch, tokenOrCtx),
  ]);

  const tree = annotateTree(buildTreeFromPaths(items));
  const manifestPaths = findManifestPaths(items);
  const importantFiles = findImportantFiles(items.map((i) => i.path));
  
  // Extract up to 20 important code files to parse internal imports
  const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go'];
  const importantSourceFiles = importantFiles.filter((path) =>
    sourceExtensions.some((ext) => path.endsWith(ext))
  );

  // All source files from the tree — used for churn (API endpoint: listCommits)
  // and to expand content fetching for complexity coverage
  const allSourceFilePaths = items
    .filter(i => i.type === 'blob' && sourceExtensions.some(ext => i.path.endsWith(ext)))
    .map(i => i.path);

  const pathsToFetch = Array.from(new Set([...manifestPaths, ...importantSourceFiles]));

  // Expand content paths to include more source files so complexity covers
  // more graph file nodes. Cap at 50 total to stay within API rate limits.
  const contentFetchPaths = Array.from(new Set([...pathsToFetch, ...allSourceFilePaths])).slice(0, 50);

  const fileContents = await fetchFileContents(owner, repo, contentFetchPaths, info.sha, tokenOrCtx);
  const dependencies = analyzeDependencies(fileContents);
  const scopedDependencies = analyzeManifestDependencies(fileContents);
  const workspacePackages = analyzeWorkspacePackages(fileContents);
  // Compute complexity from file content (synchronous, no API calls)
  const complexityData = analyzeAllFileComplexity(fileContents);

  // For churn: use all source file paths from the tree (not just important ones)
  // so the overlay covers all rendered graph file nodes. Cap at 200 to
  // avoid excessive API calls on large repos.
  const churnFetchPaths = allSourceFilePaths.length > 0
    ? allSourceFilePaths.slice(0, 200)
    : pathsToFetch;

  // Fetch churn (async API calls) and npm metadata in parallel
  const [npmDependencyMetadata, churnData] = await Promise.all([
    fetchNpmDependencyMetadataBatch(
      dependencies.filter((dependency) => dependency.ecosystem === 'npm'),
    ),
    fetchRepoChurn(owner, repo, churnFetchPaths, branch, tokenOrCtx),
  ]);

	const graph = await buildGraph({
		owner,
		repo,
		tree,
		dependencies,
		contributors,
		fileContents,
		workspacePackages,
		scopedDependencies,
		churnData,
		complexityData,
	});
	const dependencyHealth = buildDependencyHealthReport(dependencies, scopedDependencies, npmDependencyMetadata);

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
    workspacePackages,
    graph,
    contributors,
    timeline,
    importantFiles,
    totalFiles,
    totalCommits,
    dependencyHealth,
  };

  cache.set(cacheKey, analysis);
  return analysis;
}
