import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchIndexingStatus } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import type { IndexingStatus } from '@/types';
import type { IndexScope } from '@/lib/apiClient';

export function useIndexingStatus(owner: string, repo: string, enabled = true, branch?: string, scope?: IndexScope) {
  const { setIndexingStatus, indexingStatus, indexOperation, indexAction } = useSearchStore();

  const query = useQuery<{ status: IndexingStatus; operation: number; owner: string; repo: string }>({
    queryKey: ['indexingStatus', owner, repo, branch, scope, indexOperation],
    queryFn: async () => ({
      status: await fetchIndexingStatus(owner, repo, branch, scope),
      operation: indexOperation,
      owner,
      repo,
    }),
    enabled:
      enabled &&
      !!owner &&
      !!repo &&
      indexAction !== 'cancel' &&
      (indexingStatus.state !== 'paused' || indexAction === 'index'),
    refetchInterval: indexingStatus.state === 'indexing' ? 3000 : false,
    // Inherits the global bounded retry (one retry, none for not-found): a
    // transient status failure must not leave an existing index looking idle.
    staleTime: 0,
  });
  // React Query exposes only the current repository's result; old requests cannot update the store.
  useEffect(() => {
    const state = useSearchStore.getState();
    if (!query.data || query.data.operation !== state.indexOperation || state.indexAction === 'cancel') return;
    // The global operation number is shared across repos: only accept a status
    // that targets this repo, and that matches the repo owning an active op.
    if (query.data.owner !== owner || query.data.repo !== repo) return;
    if (state.indexOwner !== null && (state.indexOwner !== owner || state.indexRepo !== repo)) return;
    if (state.indexAction === 'index') {
      // A long indexing POST owns its final result. Polls may report progress, never undo the optimistic start.
      if (query.data.status.state !== 'indexing') return;
    }
    setIndexingStatus(query.data.status);
    useSearchStore.setState({ indexOwner: owner, indexRepo: repo, indexBuildId: query.data.status.buildId });
  }, [query.data, query.dataUpdatedAt, setIndexingStatus, owner, repo]);
  return query;
}
