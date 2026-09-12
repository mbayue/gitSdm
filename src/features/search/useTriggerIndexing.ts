import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerIndexing } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import { recoverIndexingStatus } from './indexing-recovery';
import { beginIndexOperation, finishIndexOperation } from './index-operations';

export function useTriggerIndexing() {
  const queryClient = useQueryClient();
  const { setIndexingStatus } = useSearchStore();

  return useMutation({
    mutationFn: ({
      owner,
      repo,
      branch,
      scope,
      buildId,
    }: {
      owner: string;
      repo: string;
      branch?: string;
      scope: import('@/lib/apiClient').IndexScope;
      buildId: string;
    }) => triggerIndexing(owner, repo, branch, scope, buildId),
    onMutate: async (variables) => {
      const context = beginIndexOperation('index');
      useSearchStore.setState({ indexBuildId: variables.buildId });
      const { previous } = context;
      setIndexingStatus({
        state: 'indexing',
        progress: previous.state === 'paused' ? previous.progress : 0,
        filesProcessed: previous.state === 'paused' ? previous.filesProcessed : 0,
        totalFiles: previous.state === 'paused' ? previous.totalFiles : 0,
        snapshotSha: previous.snapshotSha,
        coverage: previous.coverage,
      });
      await queryClient.cancelQueries({ queryKey: ['indexingStatus', variables.owner, variables.repo] });
      return context;
    },
    onSuccess: (status, _variables, context) => {
      if (context) finishIndexOperation(context, status);
    },
    onError: async (error, variables, context) => {
      const state = useSearchStore.getState();
      if (!context || context.operation !== state.indexOperation || context.revision !== state.revision) return;
      await queryClient.cancelQueries({ queryKey: ['indexingStatus', variables.owner, variables.repo] });
      finishIndexOperation(context, recoverIndexingStatus(context.previous, error));
    },
  });
}
