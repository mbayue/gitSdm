import { useMutation } from '@tanstack/react-query';
import { semanticSearch } from '@/lib/apiClient';
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