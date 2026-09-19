import { useMutation } from '@tanstack/react-query';
import { ApiError, semanticAsk } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import { scopeKey } from '@/lib/scope-key';

interface AskVariables {
  question: string;
  owner: string;
  repo: string;
  branch?: string;
  scope: import('@/lib/apiClient').IndexScope;
}

type AskContext = { revision: number; owner: string; repo: string; branch?: string; scope: string } | undefined;

function isStaleResponse(variables: AskVariables, context: AskContext): boolean {
  const state = useSearchStore.getState();
  if (!context || context.revision !== state.revision) return true;
  return (
    context.owner !== variables.owner ||
    context.repo !== variables.repo ||
    context.branch !== variables.branch ||
    context.scope !== scopeKey(variables.scope)
  );
}

function handleIndexNotFound(): void {
  const state = useSearchStore.getState();
  if (state.indexAction) return;
  if (state.indexingStatus.state === 'indexing' || state.indexingStatus.state === 'paused') return;
  state.setIndexingStatus({ state: 'idle' });
}

export function useSemanticAsk() {
  const { setAnswer, setIsLoading, setError, addRecentQuery } = useSearchStore();

  return useMutation({
    mutationFn: ({ question, owner, repo, branch, scope }: AskVariables) =>
      semanticAsk(question, owner, repo, branch, scope),
    onMutate: (vars) => {
      setIsLoading(true);
      setError(null);
      useSearchStore.setState({ resultCoverage: undefined });
      addRecentQuery(vars.question);
      return {
        revision: useSearchStore.getState().revision,
        owner: vars.owner,
        repo: vars.repo,
        branch: vars.branch,
        scope: scopeKey(vars.scope),
      };
    },
    onSuccess: (data, variables, context) => {
      if (isStaleResponse(variables, context)) return;
      const qa = { answer: data.answer, citations: data.citations };
      setAnswer(qa);
      useSearchStore.setState({ resultCoverage: data.coverage });
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
