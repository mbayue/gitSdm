import { describe, expect, it } from 'bun:test';
import { parsePaths } from '@/features/search/parsePaths';
import { useSearchStore } from '@/features/search/searchStore';
import type { IndexingStatus } from '@/types';
import {
  isOperationActive,
  isSearchEnabled,
  resolveBuildId,
  resolvePollingScope,
  resolveRequestBranch,
  resolveRunningSha,
  shouldResetSearchState,
} from './search-page-logic';

const snapshot = (
  indexAction: 'index' | 'cancel' | null,
  indexingStatus: IndexingStatus,
) => ({ indexAction, indexingStatus });

describe('SearchPage logic & state contracts', () => {
  it('parses scoped include and exclude path inputs cleanly', () => {
    expect(parsePaths('')).toEqual([]);
    expect(parsePaths('   ')).toEqual([]);
    expect(parsePaths('src, test, ')).toEqual(['src', 'test']);
    expect(parsePaths('server/api,  components/ui/button.tsx')).toEqual([
      'server/api',
      'components/ui/button.tsx',
    ]);
  });

  it('skips the scope-change reset while an index operation is active', () => {
    expect(shouldResetSearchState(snapshot(null, { state: 'idle' }))).toBe(true);
    expect(shouldResetSearchState(snapshot(null, { state: 'complete', chunkCount: 1, timestamp: 1 }))).toBe(true);
    expect(shouldResetSearchState(snapshot(null, { state: 'failed', error: 'x', failedFiles: 1 }))).toBe(true);
    expect(shouldResetSearchState(snapshot('index', { state: 'idle' }))).toBe(false);
    expect(shouldResetSearchState(snapshot('cancel', { state: 'idle' }))).toBe(false);
    expect(
      shouldResetSearchState(snapshot(null, { state: 'indexing', progress: 1, filesProcessed: 1, totalFiles: 2 })),
    ).toBe(false);
    expect(shouldResetSearchState(snapshot(null, { state: 'paused', error: 'x', reason: 'rate-limit' }))).toBe(false);
  });

  it('scope change on an idle index removes cached results and coverage', () => {
    useSearchStore.setState({
      indexingStatus: { state: 'complete', chunkCount: 5, timestamp: 1 },
      indexAction: null,
      results: [{ filePath: 'a.ts', startLine: 1, endLine: 5, snippet: 'code', language: 'ts', score: 0.9 }],
      answer: { answer: 'text', citations: [] },
      resultCoverage: { indexedFiles: 10, totalFiles: 50, percent: 20 },
    });

    expect(shouldResetSearchState(useSearchStore.getState())).toBe(true);
    useSearchStore.getState().reset();

    const updated = useSearchStore.getState();
    expect(updated.results).toEqual([]);
    expect(updated.answer).toBeNull();
    expect(updated.resultCoverage).toBeUndefined();
    expect(updated.indexingStatus.state).toBe('idle');
  });

  it('scope change during an active operation clears results but preserves the operation', () => {
    useSearchStore.setState({
      indexingStatus: { state: 'indexing', progress: 20, filesProcessed: 5, totalFiles: 25, snapshotSha: 'abc1234' },
      indexAction: null,
      indexOperation: 7,
      indexBuildId: 'build-7',
      indexScope: { includePaths: ['server'], excludePaths: [] },
      results: [{ filePath: 'a.ts', startLine: 1, endLine: 5, snippet: 'code', language: 'ts', score: 0.9 }],
      resultCoverage: { indexedFiles: 3, totalFiles: 25, percent: 12 },
    });

    expect(shouldResetSearchState(useSearchStore.getState())).toBe(false);
    useSearchStore.getState().resetQueryResults();

    const updated = useSearchStore.getState();
    expect(updated.results).toEqual([]);
    expect(updated.resultCoverage).toBeUndefined();
    expect(updated.indexingStatus.state).toBe('indexing');
    expect(updated.indexOperation).toBe(7);
    expect(updated.indexBuildId).toBe('build-7');
    expect(updated.indexScope).toEqual({ includePaths: ['server'], excludePaths: [] });
  });

  it('polls the operation scope while active and follows the live scope after it settles', () => {
    const live = { includePaths: ['new'], excludePaths: [] };
    const captured = { includePaths: ['old'], excludePaths: [] };

    expect(isOperationActive('index', { state: 'idle' })).toBe(true);
    expect(isOperationActive(null, { state: 'indexing', progress: 1, filesProcessed: 1, totalFiles: 2 })).toBe(true);
    expect(isOperationActive(null, { state: 'paused', error: 'x', reason: 'rate-limit' })).toBe(true);
    expect(isOperationActive(null, { state: 'complete', chunkCount: 1, timestamp: 1 })).toBe(false);

    expect(resolvePollingScope(true, captured, live)).toBe(captured);
    expect(resolvePollingScope(true, null, live)).toBe(live);
    expect(resolvePollingScope(false, captured, live)).toBe(live);
  });

  it('resolves the request branch from the running snapshot before the selected branch', () => {
    expect(resolveRunningSha({ state: 'idle' })).toBeUndefined();
    expect(resolveRunningSha({ state: 'complete', chunkCount: 1, timestamp: 1 })).toBeUndefined();
    expect(
      resolveRunningSha({ state: 'indexing', progress: 1, filesProcessed: 1, totalFiles: 2, snapshotSha: 'abc1234' }),
    ).toBe('abc1234');
    expect(resolveRunningSha({ state: 'paused', error: 'x', reason: 'rate-limit', snapshotSha: 'def5678' })).toBe(
      'def5678',
    );

    expect(resolveRequestBranch('abc1234', 'main')).toBe('abc1234');
    expect(resolveRequestBranch(undefined, 'main')).toBe('main');
    expect(resolveRequestBranch(undefined, undefined)).toBeUndefined();
  });

  it('reuses the paused build id and starts a fresh one otherwise', () => {
    expect(resolveBuildId({ state: 'paused', error: 'x', reason: 'rate-limit' }, 'build-1')).toBe('build-1');
    expect(resolveBuildId({ state: 'paused', error: 'x', reason: 'rate-limit' }, undefined)).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveBuildId({ state: 'idle' }, 'build-1')).not.toBe('build-1');
    expect(resolveBuildId({ state: 'complete', chunkCount: 1, timestamp: 1 }, 'build-1')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps search enabled for partial coverage and complete indexes only', () => {
    expect(isSearchEnabled({ state: 'complete', chunkCount: 1, timestamp: 1 })).toBe(true);
    expect(
      isSearchEnabled({
        state: 'paused',
        error: 'x',
        reason: 'rate-limit',
        coverage: { indexedFiles: 15, totalFiles: 30, percent: 50 },
      }),
    ).toBe(true);
    expect(isSearchEnabled({ state: 'idle' })).toBe(false);
    expect(isSearchEnabled({ state: 'paused', error: 'x', reason: 'rate-limit' })).toBe(false);
    expect(
      isSearchEnabled({ state: 'indexing', progress: 1, filesProcessed: 1, totalFiles: 2 }),
    ).toBe(false);
  });

  it('resetQueryResults preserves active indexing state and operation ID', () => {
    useSearchStore.setState({
      indexingStatus: {
        state: 'indexing',
        progress: { current: 10, total: 50 },
        snapshotSha: 'abc1234',
      },
      indexOperation: 42,
      indexBuildId: 'build-xyz',
      results: [{ filePath: 'a.ts', startLine: 1, endLine: 5, snippet: 'code', language: 'ts', score: 0.9 }],
      answer: { answer: 'text', citations: [] },
      error: 'some error',
      resultCoverage: { indexedFiles: 10, totalFiles: 50, percent: 20 },
    });

    useSearchStore.getState().resetQueryResults();

    const updated = useSearchStore.getState();
    expect(updated.indexingStatus.state).toBe('indexing');
    expect(updated.indexOperation).toBe(42);
    expect(updated.indexBuildId).toBe('build-xyz');
    expect(updated.results).toEqual([]);
    expect(updated.answer).toBeNull();
    expect(updated.error).toBeNull();
    expect(updated.resultCoverage).toBeUndefined();
  });

  it('full reset clears active indexing and increments revision', () => {
    const prevRev = useSearchStore.getState().revision;
    useSearchStore.setState({
      indexingStatus: { state: 'paused', reason: 'rate-limit' },
      indexBuildId: 'build-123',
    });

    useSearchStore.getState().reset();

    const updated = useSearchStore.getState();
    expect(updated.indexingStatus.state).toBe('idle');
    expect(updated.indexBuildId).toBeUndefined();
    expect(updated.revision).toBe(prevRev + 1);
  });
});
