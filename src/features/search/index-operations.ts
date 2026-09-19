import type { IndexingStatus } from '@/types';
import { useSearchStore } from './searchStore';

export function beginIndexOperation(action: 'index' | 'cancel', owner?: string, repo?: string) {
  const state = useSearchStore.getState();
  const operation = state.indexOperation + 1;
  useSearchStore.setState({
    indexOperation: operation,
    indexAction: action,
    indexOwner: owner ?? state.indexOwner,
    indexRepo: repo ?? state.indexRepo,
  });
  return { operation, revision: state.revision, previous: state.indexingStatus };
}

export function finishIndexOperation(context: ReturnType<typeof beginIndexOperation>, status: IndexingStatus): boolean {
  const state = useSearchStore.getState();
  // Index operations are keyed by indexOperation only: query resets bump
  // revision (invalidating search/ask) without abandoning the index build.
  // Full resets bump indexOperation, invalidating outstanding operations.
  if (state.indexOperation !== context.operation) return false;
  useSearchStore.setState({ indexOperation: context.operation + 1, indexAction: null, indexingStatus: status });
  return true;
}
