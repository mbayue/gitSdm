import type { IndexingStatus } from '@/types';
import { useSearchStore } from './searchStore';

export function beginIndexOperation(action: 'index' | 'cancel') {
  const state = useSearchStore.getState();
  const operation = state.indexOperation + 1;
  useSearchStore.setState({ indexOperation: operation, indexAction: action });
  return { operation, revision: state.revision, previous: state.indexingStatus };
}

export function finishIndexOperation(context: ReturnType<typeof beginIndexOperation>, status: IndexingStatus): boolean {
  const state = useSearchStore.getState();
  if (state.indexOperation !== context.operation || state.revision !== context.revision) return false;
  useSearchStore.setState({ indexOperation: context.operation + 1, indexAction: null, indexingStatus: status });
  return true;
}
