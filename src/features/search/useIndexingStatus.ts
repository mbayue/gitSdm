import { useQuery } from '@tanstack/react-query';
import { fetchIndexingStatus } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import type { IndexingStatus } from '@/types';

export function useIndexingStatus(owner: string, repo: string, enabled = true) {
  const { setIndexingStatus } = useSearchStore();

  return useQuery<IndexingStatus>({
    queryKey: ['indexingStatus', owner, repo],
    queryFn: async () => {
      const status = await fetchIndexingStatus(owner, repo);
      setIndexingStatus(status);
      return status;
    },
    enabled: enabled && !!owner && !!repo,
    refetchInterval: () => {
      // Read from Zustand store (updated by useTriggerIndexing) instead of
      // query.state.data which is undefined on first call, preventing polling.
      const storeState = useSearchStore.getState().indexingStatus.state;
      return storeState === 'indexing' || storeState === 'idle' ? 3000 : false;
    },
    staleTime: 0,
  });
}