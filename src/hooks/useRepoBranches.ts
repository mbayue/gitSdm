import { useQuery } from '@tanstack/react-query';
import { fetchRepoBranches } from '@/lib/apiClient';

export function useRepoBranches(owner: string, repo: string, enabled = true) {
  return useQuery({
    queryKey: ['branches', owner, repo],
    queryFn: () => fetchRepoBranches(owner, repo),
    enabled: enabled && !!owner && !!repo,
    staleTime: 1000 * 60 * 10, // Cache branch list for 10 minutes
  });
}
