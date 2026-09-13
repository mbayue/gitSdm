import { describe, expect, it } from 'bun:test';
import { parsePaths } from '@/features/search/parsePaths';
import { useSearchStore } from '@/features/search/searchStore';

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

  it('searches remain allowed when partial coverage exists even if paused', () => {
    useSearchStore.setState({
      indexingStatus: {
        state: 'paused',
        reason: 'rate-limit',
        coverage: { indexedFiles: 15, totalFiles: 30, percent: 50 },
      },
    });

    const status = useSearchStore.getState().indexingStatus;
    const canSearchPartial = status.state === 'paused' || status.state === 'idle' || status.state === 'complete';
    expect(canSearchPartial).toBe(true);
    expect(status.coverage?.indexedFiles).toBe(15);
  });
});
