import { useQuery } from '@tanstack/react-query';
import { analyzeRepo } from '@/lib/apiClient';
import { useRepoChurn } from './useRepoChurn';
import { useRepoHealth } from './useRepoHealth';
import { useMemo } from 'react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';

export function useAnalyzeRepo(owner: string, repo: string, branch: string | null = null, enabled = true) {
  const url = `https://github.com/${owner}/${repo}`;
  const analysis = useQuery<RepoAnalysis>({
    queryKey: ['analyze-repo', owner, repo, branch],
    queryFn: () => analyzeRepo(url, branch || undefined),
    enabled: enabled && !!owner && !!repo,
    staleTime: 1000 * 60 * 30,
  });
  const colorMode = useVizStore((s) => s.colorMode);
  const sha = analysis.data?.meta.sha ?? '';
  const health = useRepoHealth(owner, repo, sha, enabled && !!analysis.data);
  const churn = useRepoChurn(owner, repo, sha, enabled && colorMode === 'churn');
  const data = useMemo(() => {
    if (!analysis.data) return undefined;
    return {
      ...analysis.data,
      dependencyHealth: health.data,
      graph: {
        ...analysis.data.graph,
        nodes: analysis.data.graph.nodes.map((node) => {
          const extra = node.data.path ? churn.data?.files[node.data.path] : undefined;
          return extra ? { ...node, data: { ...node.data, ...extra } } : node;
        }),
      },
    };
  }, [analysis.data, churn.data, health.data]);
  return {
    ...analysis,
    data,
    churnLoading: churn.isPending && churn.isFetching,
    churnError: churn.error,
  };
}
