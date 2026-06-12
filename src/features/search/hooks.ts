import { useMutation, useQuery } from '@tanstack/react-query';
import {
  semanticSearch,
  semanticAsk,
  triggerIndexing,
  fetchIndexingStatus,
} from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import type { SearchResultCard, IndexingStatus } from '@/types';

export function useSemanticSearch() {
  const { setResults, setIsLoading, setError, addRecentQuery } = useSearchStore();

  return useMutation({
    mutationFn: ({
      query,
      owner,
      repo,
      branch,
    }: {
      query: string;
      owner: string;
      repo: string;
      branch?: string;
    }) => semanticSearch(query, owner, repo, branch),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data, vars) => {
      const cards: SearchResultCard[] = data.results.map((r) => ({
        filePath: r.chunk.filePath,
        startLine: r.chunk.startLine,
        endLine: r.chunk.endLine,
        snippet: r.chunk.content.split('\n').slice(0, 10).join('\n'),
        language: r.chunk.language,
        score: r.score,
      }));
      setResults(cards);
      addRecentQuery(data.query);
      setIsLoading(false);
      // Cache results for this query
      const cacheKey = `${vars.owner}/${vars.repo}:${vars.query}`;
      const store = useSearchStore.getState();
      const newCache = new Map(store.searchCache);
      newCache.set(cacheKey, cards);
      useSearchStore.setState({ searchCache: newCache });
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsLoading(false);
    },
  });
}

export function useSemanticAsk() {
  const { setAnswer, setIsLoading, setError, addRecentQuery } = useSearchStore();

  return useMutation({
    mutationFn: ({
      question,
      owner,
      repo,
      branch,
    }: {
      question: string;
      owner: string;
      repo: string;
      branch?: string;
    }) => semanticAsk(question, owner, repo, branch),
    onMutate: (vars) => {
      setIsLoading(true);
      setError(null);
      addRecentQuery(vars.question);
    },
    onSuccess: (data, vars) => {
      const qa = { answer: data.answer, citations: data.citations };
      setAnswer(qa);
      setIsLoading(false);
      // Cache answer for this question
      const cacheKey = `${vars.owner}/${vars.repo}:${vars.question}`;
      const store = useSearchStore.getState();
      const newCache = new Map(store.askCache);
      newCache.set(cacheKey, qa);
      useSearchStore.setState({ askCache: newCache });
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsLoading(false);
    },
  });
}

export function useTriggerIndexing() {
  const { setIndexingStatus } = useSearchStore();

  return useMutation({
    mutationFn: ({
      owner,
      repo,
      branch,
    }: {
      owner: string;
      repo: string;
      branch?: string;
    }) => triggerIndexing(owner, repo, branch),
    onSuccess: () => {
      setIndexingStatus({
        state: 'indexing',
        progress: 0,
        filesProcessed: 0,
        totalFiles: 0,
      });
    },
  });
}

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
