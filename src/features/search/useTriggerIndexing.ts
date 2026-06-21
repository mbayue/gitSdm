import { useMutation } from '@tanstack/react-query';
import { triggerIndexing } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';

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
    onMutate: () => {
      setIndexingStatus({
        state: 'indexing',
        progress: 0,
        filesProcessed: 0,
        totalFiles: 0,
      });
    },
    onError: (error) => {
      setIndexingStatus({
        state: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start indexing',
        failedFiles: 0,
      });
    },
  });
}