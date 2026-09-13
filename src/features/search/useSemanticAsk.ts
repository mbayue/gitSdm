import { useMutation } from '@tanstack/react-query';
import { ApiError, semanticAsk } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';

export function useSemanticAsk() {
  const { setAnswer, setIsLoading, setError, addRecentQuery } = useSearchStore();

  return useMutation({
    mutationFn: ({
      question,
      owner,
      repo,
      branch,
      scope,
    }: {
      question: string;
      owner: string;
      repo: string;
      branch?: string;
      scope: import('@/lib/apiClient').IndexScope;
    }) => semanticAsk(question, owner, repo, branch, scope),
    onMutate: (vars) => {
      setIsLoading(true);
      setError(null);
      useSearchStore.setState({ resultCoverage: undefined });
      addRecentQuery(vars.question);
      return { revision: useSearchStore.getState().revision };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.revision !== useSearchStore.getState().revision) return;
      const qa = { answer: data.answer, citations: data.citations };
      setAnswer(qa);
      useSearchStore.setState({ resultCoverage: data.coverage });
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
