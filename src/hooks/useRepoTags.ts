import { useQuery } from '@tanstack/react-query';
import { fetchRepoTags } from '@/lib/apiClient';

export function useRepoTags(owner: string, repo: string, enabled = true) {
  return useQuery({
    queryKey: ['tags', owner, repo],
    queryFn: () => fetchRepoTags(owner, repo),
    enabled: enabled && !!owner && !!repo,
    staleTime: 1000 * 60 * 10, // Cache tag list for 10 minutes
  });
}
