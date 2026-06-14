import { useMutation } from '@tanstack/react-query';
import { semanticAsk } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';

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