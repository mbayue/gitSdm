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

test('query reset preserves an outstanding index operation', () => {
  useSearchStore.getState().reset();
  const operation = beginIndexOperation('index', 'o', 'r');
  useSearchStore.getState().resetQueryResults();
  expect(finishIndexOperation(operation, { state: 'complete', chunkCount: 1, timestamp: 0 })).toBe(true);
  expect(useSearchStore.getState().indexOwner).toBe('o');
  expect(useSearchStore.getState().indexRepo).toBe('r');
});
