import { useMutation } from '@tanstack/react-query';
import { ApiError, semanticSearch } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import type { SearchResultCard } from '@/types';

export function useSemanticSearch() {
  const { setResults, setIsLoading, setError, addRecentQuery } = useSearchStore();

  return useMutation({
    mutationFn: ({
      query,
      owner,
      repo,
      branch,
      scope,
    }: {
      query: string;
      owner: string;
      repo: string;
      branch?: string;
      scope: import('@/lib/apiClient').IndexScope;
    }) => semanticSearch(query, owner, repo, branch, scope),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      useSearchStore.setState({ resultCoverage: undefined });
      return { revision: useSearchStore.getState().revision };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.revision !== useSearchStore.getState().revision) return;
      const cards: SearchResultCard[] = data.results.map((r) => ({
        filePath: r.chunk.filePath,
        startLine: r.chunk.startLine,
        endLine: r.chunk.endLine,
        snippet: r.chunk.content.split('\n').slice(0, 10).join('\n'),
        language: r.chunk.language,
        score: r.score,
      }));
      setResults(cards);
      useSearchStore.setState({ resultCoverage: data.coverage });
      addRecentQuery(data.query);
      setIsLoading(false);
    },
    onError: (err: Error, _variables, context) => {
      if (context?.revision !== useSearchStore.getState().revision) return;
      setError(err.message);
      useSearchStore.setState({ resultCoverage: undefined });
      if (err instanceof ApiError && err.code === 'INDEX_NOT_FOUND') {
        useSearchStore.getState().setIndexingStatus({ state: 'idle' });
      }
      setIsLoading(false);
    },
  });
}
