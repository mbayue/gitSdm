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