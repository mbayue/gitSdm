import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChurnBatch } from '@/lib/apiClient';
import { mergeChurn, pendingChurn, churnInterval } from '@/lib/churn-progress';
import { useChatConfigRevision } from '@/stores/chatConfigStore';

import type { ChurnResponse } from '@/types/churn';

export function useRepoChurn(owner: string, repo: string, sha: string, enabled: boolean) {
  const client = useQueryClient();
  // Credential revision scopes cached churn to the PAT that fetched it, so a
  // PAT change discards prior-credential results instead of marking them done.
  const { revision } = useChatConfigRevision();
  const queryKey = ['repo-churn', owner, repo, sha, revision];
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
          scope: previous?.scope,
        }),
      );
    },
    enabled: enabled && !!sha,
    retry: false,
    staleTime: 30 * 60 * 1000,
    refetchInterval: (query) => (enabled ? churnInterval(query.state.data) : false),
  });
}
