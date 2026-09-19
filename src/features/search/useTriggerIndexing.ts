import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerIndexing, type IndexScope } from '@/lib/apiClient';
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
      scope: IndexScope;
      buildId: string;
    }) => triggerIndexing(owner, repo, branch, scope, buildId),
    onMutate: async (variables) => {
      const context = beginIndexOperation('index', variables.owner, variables.repo);
      // Polling keeps targeting this scope until the operation settles.
      useSearchStore.setState({ indexBuildId: variables.buildId, indexScope: variables.scope });
      const { previous } = context;
      // Only a paused build resumes its snapshot; a fresh build (e.g. retry after
      // a branch advance) must not inherit the old snapshotSha/coverage or polls
      // keep targeting a stale snapshot.
      const resuming = previous.state === 'paused';
      setIndexingStatus({
        state: 'indexing',
        progress: resuming ? previous.progress : 0,
        filesProcessed: resuming ? previous.filesProcessed : 0,
        totalFiles: resuming ? previous.totalFiles : 0,
        snapshotSha: resuming ? previous.snapshotSha : undefined,
        coverage: resuming ? previous.coverage : undefined,
      });
      await queryClient.cancelQueries({ queryKey: ['indexingStatus', variables.owner, variables.repo] });
      return context;
    },
    onSuccess: (status, _variables, context) => {
      if (context) finishIndexOperation(context, status);
    },
    onError: async (error, variables, context) => {
      const state = useSearchStore.getState();
      if (!context || context.operation !== state.indexOperation) return;
      await queryClient.cancelQueries({ queryKey: ['indexingStatus', variables.owner, variables.repo] });
      finishIndexOperation(context, recoverIndexingStatus(context.previous, error));
    },
  });
}
