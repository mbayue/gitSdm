import type { SearchCoverage } from '../../src/types';
import type { VectorStore } from './types';
import { createVectorStore } from './vector-store';
import { createCheckpoints } from './checkpoints';
import { SEARCH_LIMITS } from './limits';
import { searchIndexIdentity } from './index-identity';

export function createIndexAvailability(
  deps: { getVectorStore(): VectorStore },
  checkpoints: ReturnType<typeof createCheckpoints>,
  limits = SEARCH_LIMITS,
  now = Date.now,
) {
  const published = new Map<string, SearchCoverage>();
  const available = (key: string) => {
    const store = deps.getVectorStore();
    if (store.hasIndex(key))
      return {
        store,
        key,
        coverage: published.get(key) ?? {
          kind: 'complete' as const,
          commitSha: searchIndexIdentity(key).snapshotSha,
          indexedFiles: 0,
          totalFiles: 0,
        },
      };
    for (const [id, coverage] of [...published].reverse()) {
      if (!store.hasIndex(id)) {
        published.delete(id);
        continue;
      }
      if (searchIndexIdentity(id).family === searchIndexIdentity(key).family)
        return { store, key: id, coverage: { ...coverage, kind: 'previous' as const } };
    }
    const checkpoint = checkpoints.get(key);
    if (!checkpoint?.completed.size) return undefined;
    const chunks = checkpoint.chunks.filter((chunk) => checkpoint.completed.has(chunk.metadata.filePath));
    if (!chunks.length) return undefined;
    const partial = createVectorStore(limits, now);
    partial.replaceIndex(key, chunks);
    return {
      store: partial,
      key,
      coverage: {
        kind: 'partial' as const,
        commitSha: chunks[0].metadata.commitSha,
        indexedFiles: checkpoint.completed.size,
        totalFiles: checkpoint.totalFiles,
      },
    };
  };
  return {
    available,
    publish(key: string, coverage: SearchCoverage) {
      published.set(key, coverage);
      for (const id of published.keys()) if (!deps.getVectorStore().hasIndex(id)) published.delete(id);
    },
  };
}
