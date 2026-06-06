import { useQuery } from '@tanstack/react-query';
import { analyzeRepo } from '@/lib/api-client';
import type { RepoAnalysis } from '@/types';

export function useAnalyzeRepo(owner: string, repo: string, branch: string | null = null, enabled = true) {
  const url = `https://github.com/${owner}/${repo}`;
  return useQuery<RepoAnalysis>({
    queryKey: ['analyze-repo', owner, repo, branch],
    queryFn: () => analyzeRepo(url, branch || undefined),
    enabled: enabled && !!owner && !!repo,
    staleTime: 1000 * 60 * 30,
  });
}
