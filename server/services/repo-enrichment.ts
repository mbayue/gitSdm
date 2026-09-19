import { analyzeRepository } from './analyze-repo';
import { fetchRepoChurn } from './churn-service';
import { fetchNpmDependencyMetadataBatch } from './npm-registry';
import { buildDependencyHealthReport } from './dependency-health';
import { fetchFileContents, fetchFlatTree, fetchRepoInfo, findManifestPaths } from '../github/fetch-tree';
import { analyzeDependencies, analyzeManifestDependencies } from '../parser/dependency-analyzer';
import { findImportantFiles } from '../parser/file-classifier';
import type { RequestContext } from '../utils/context';
import type { ChurnContinuation } from '../../src/types/churn';

export async function enrichRepository(
  input: { owner: string; repo: string; branch?: string },
  kind: 'churn' | 'health',
  ctx: RequestContext,
  continuation: ChurnContinuation = {},
) {
  if (kind === 'health') return fetchDependencyHealth(input, ctx);
  const analysis = await analyzeRepository(input, ctx);
  const paths = analysis.graph.nodes
    .flatMap((node) =>
      node.type === 'file' && node.data.path && /\.(tsx?|jsx?|py|go)$/.test(node.data.path) ? [node.data.path] : [],
    )
    .slice(0, 200);
  return fetchRepoChurn(input.owner, input.repo, paths, analysis.meta.sha, ctx, 90, continuation);
}

// Dependency-focused health path: a cold /api/repo/health must not pay for the
// full analyzeRepository (contributors, timeline, commit counts, graph build)
// when only manifest/source contents are needed. Content selection mirrors
// analyze-repo so reports stay identical; analyzeRepository's cache still serves
// callers that need the full analysis.
async function fetchDependencyHealth(
  input: { owner: string; repo: string; branch?: string },
  ctx: RequestContext,
) {
  const info = await fetchRepoInfo(input.owner, input.repo, input.branch, ctx);
  const { items } = await fetchFlatTree(input.owner, input.repo, info.sha, ctx);
  const manifestPaths = findManifestPaths(items);
  const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go'];
  const importantSourceFiles = findImportantFiles(items.map((item) => item.path)).filter((path) =>
    sourceExtensions.some((ext) => path.endsWith(ext)),
  );
  const contentFetchPaths = Array.from(new Set([...manifestPaths, ...importantSourceFiles])).slice(0, 50);
  const fileContents = await fetchFileContents(input.owner, input.repo, contentFetchPaths, info.sha, ctx);
  const dependencies = analyzeDependencies(fileContents);
  const scopedDependencies = analyzeManifestDependencies(fileContents);
  // No truncation: every npm dependency gets registry metadata. Capping the
  // batch would silently report omitted deps as 'unknown', indistinguishable
  // from missing or failed lookups. Batching + the 24h registry cache bound cost.
  const metadata = await fetchNpmDependencyMetadataBatch(dependencies.filter((dep) => dep.ecosystem === 'npm'));
  return buildDependencyHealthReport(dependencies, scopedDependencies, metadata);
}
