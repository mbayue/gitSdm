import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchIndexingStatus } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import type { IndexingStatus } from '@/types';

export function useIndexingStatus(owner: string, repo: string, enabled = true, branch?: string) {
  const { setIndexingStatus, indexingStatus } = useSearchStore();

  const query = useQuery<IndexingStatus>({
    queryKey: ['indexingStatus', owner, repo, branch],
    queryFn: () => fetchIndexingStatus(owner, repo, branch),
    enabled: enabled && !!owner && !!repo,
    refetchInterval: indexingStatus.state === 'indexing' ? 3000 : false,
    retry: false,
    staleTime: 0,
  });
  // React Query exposes only the current repository's result; old requests cannot update the store.
  useEffect(() => {
    if (query.data) setIndexingStatus(query.data);
  }, [query.data, query.dataUpdatedAt, setIndexingStatus]);
  return query;
}
