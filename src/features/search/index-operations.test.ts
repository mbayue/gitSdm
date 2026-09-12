import { test, expect } from 'bun:test';
import { useSearchStore } from './searchStore';
import { beginIndexOperation, finishIndexOperation } from './index-operations';

test('cancel invalidates the preceding indexing callback', () => {
  useSearchStore.getState().reset();
  const indexing = beginIndexOperation('index');
  const cancelling = beginIndexOperation('cancel');
  expect(finishIndexOperation(cancelling, { state: 'idle' })).toBe(true);
  expect(finishIndexOperation(indexing, { state: 'complete', chunkCount: 10, timestamp: 0 })).toBe(false);
  expect(useSearchStore.getState().indexingStatus.state).toBe('idle');
  expect(useSearchStore.getState().indexOperation).toBeGreaterThan(cancelling.operation);
});

test('navigation invalidates an outstanding operation', () => {
  const operation = beginIndexOperation('index');
  useSearchStore.getState().reset();
  expect(finishIndexOperation(operation, { state: 'complete', chunkCount: 1, timestamp: 0 })).toBe(false);
  expect(useSearchStore.getState().indexAction).toBeNull();
});
