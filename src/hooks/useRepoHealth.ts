import { useQuery } from '@tanstack/react-query';
import { fetchRepoEnrichment } from '@/lib/apiClient';
import { useChatConfigRevision } from '@/stores/chatConfigStore';
import type { DependencyHealthReport } from '@/types';

export function useRepoHealth(owner: string, repo: string, sha: string, enabled: boolean) {
  // Credential revision keeps one account's private health report from serving
  // another account after a PAT change.
  const { revision } = useChatConfigRevision();
  return useQuery({
    queryKey: ['repo-health', owner, repo, sha, revision],
    queryFn: () => fetchRepoEnrichment<DependencyHealthReport>(owner, repo, sha, 'health'),
    enabled: enabled && !!sha,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
}
