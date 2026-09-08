import { analyzeRepository } from './analyze-repo';
import { fetchRepoChurn } from './churn-service';
import { fetchNpmDependencyMetadataBatch } from './npm-registry';
import { buildDependencyHealthReport } from './dependency-health';
import type { RequestContext } from '../utils/context';
import type { ChurnContinuation } from '../../src/types/churn';

export async function enrichRepository(
  input: { owner: string; repo: string; branch?: string },
  kind: 'churn' | 'health',
  ctx: RequestContext,
  continuation: ChurnContinuation = {},
) {
  const analysis = await analyzeRepository(input, ctx);
  if (kind === 'churn') {
    const paths = analysis.graph.nodes
      .flatMap((node) =>
        node.type === 'file' && node.data.path && /\.(tsx?|jsx?|py|go)$/.test(node.data.path) ? [node.data.path] : [],
      )
      .slice(0, 200);
    return fetchRepoChurn(input.owner, input.repo, paths, analysis.meta.sha, ctx, 90, continuation);
  }
  const metadata = await fetchNpmDependencyMetadataBatch(
    analysis.dependencies.filter((dep) => dep.ecosystem === 'npm'),
  );
  return buildDependencyHealthReport(analysis.dependencies, analysis.scopedDependencies, metadata);
}
