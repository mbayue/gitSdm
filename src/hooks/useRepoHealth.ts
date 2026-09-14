import { useQuery } from '@tanstack/react-query';
import { fetchRepoEnrichment } from '@/lib/apiClient';
import type { DependencyHealthReport } from '@/types';

export function useRepoHealth(owner: string, repo: string, sha: string, enabled: boolean) {
  return useQuery({
    queryKey: ['repo-health', owner, repo, sha],
    queryFn: () => fetchRepoEnrichment<DependencyHealthReport>(owner, repo, sha, 'health'),
    enabled: enabled && !!sha,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
}
