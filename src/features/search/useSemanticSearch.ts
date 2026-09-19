import { useMutation } from '@tanstack/react-query';
import { ApiError, semanticSearch } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import { scopeKey } from '@/lib/scope-key';
import type { SearchResultCard } from '@/types';

interface SearchVariables {
  query: string;
  owner: string;
  repo: string;
  branch?: string;
  scope: import('@/lib/apiClient').IndexScope;
}

type SearchContext = { revision: number; owner: string; repo: string; branch?: string; scope: string } | undefined;

function isStaleResponse(variables: SearchVariables, context: SearchContext): boolean {
  const state = useSearchStore.getState();
  if (!context || context.revision !== state.revision) return true;
  return (
    context.owner !== variables.owner ||
    context.repo !== variables.repo ||
    context.branch !== variables.branch ||
    context.scope !== scopeKey(variables.scope)
  );
}

// A paused index owns partial coverage: INDEX_NOT_FOUND from a scope edit must
// not flip the global status to idle and hide the resumable operation.
function handleIndexNotFound(): void {
  const state = useSearchStore.getState();
  if (state.indexAction) return;
  if (state.indexingStatus.state === 'indexing' || state.indexingStatus.state === 'paused') return;
  state.setIndexingStatus({ state: 'idle' });
}

export function useSemanticSearch() {
  const { setResults, setIsLoading, setError, addRecentQuery } = useSearchStore();

  return useMutation({
    mutationFn: ({ query, owner, repo, branch, scope }: SearchVariables) =>
      semanticSearch(query, owner, repo, branch, scope),
    onMutate: (variables) => {
      setIsLoading(true);
      setError(null);
      useSearchStore.setState({ resultCoverage: undefined });
      return {
        revision: useSearchStore.getState().revision,
        owner: variables.owner,
        repo: variables.repo,
        branch: variables.branch,
        scope: scopeKey(variables.scope),
      };
    },
    onSuccess: (data, variables, context) => {
      if (isStaleResponse(variables, context)) return;
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
    onError: (err: Error, variables, context) => {
      if (isStaleResponse(variables, context)) return;
      setError(err.message);
      useSearchStore.setState({ resultCoverage: undefined });
      if (err instanceof ApiError && err.code === 'INDEX_NOT_FOUND') handleIndexNotFound();
      setIsLoading(false);
    },
  });
}
