import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChurnBatch } from '@/lib/apiClient';
import { mergeChurn, pendingChurn, churnInterval } from '@/lib/churn-progress';

import type { ChurnResponse } from '@/types/churn';

export function useRepoChurn(owner: string, repo: string, sha: string, enabled: boolean) {
  const client = useQueryClient();
  const queryKey = ['repo-churn', owner, repo, sha];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const previous = client.getQueryData<ChurnResponse>(queryKey);
      const pending = previous ? pendingChurn(previous) : undefined;
      if (previous && !previous.complete && !pending?.length) return previous;
      return mergeChurn(
        previous,
        await fetchChurnBatch(owner, repo, sha, {
          completed: Object.keys(previous?.files ?? {}),
          pending,
        }),
      );
    },
    enabled: enabled && !!sha,
    retry: false,
    staleTime: 30 * 60 * 1000,
    refetchInterval: (query) => (enabled ? churnInterval(query.state.data) : false),
  });
}
