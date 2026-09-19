import type { IndexingStatus, IndexingPipeline } from './types';
import { buildSnapshot, indexingDependencies as defaults } from './build-snapshot';
import { createCheckpoints } from './checkpoints';
import { createIndexAvailability } from './index-availability';
import { AppError, toErrorPayload } from '../utils/errors';
import { logError } from '../utils/logger';
import { searchIndexKey, searchIndexIdentity } from './index-identity';
import { SEARCH_LIMITS } from './limits';

export function createIndexingPipeline(deps = defaults, limits = SEARCH_LIMITS, now = Date.now): IndexingPipeline {
  const statuses = new Map<string, { value: IndexingStatus; expires: number }>();
  const active = new Map<string, { cancelled: boolean }>();
  const checkpoints = createCheckpoints(limits, now);
  const { available, publish } = createIndexAvailability(deps, checkpoints, limits, now);
  const save = (key: string, value: IndexingStatus) => {
    value = { ...value, snapshotSha: searchIndexIdentity(key).snapshotSha };
    for (const [id, entry] of statuses) if (entry.expires <= now() && !active.has(id)) statuses.delete(id);
    statuses.delete(key);
    while (statuses.size >= limits.statuses) {
      const oldest = [...statuses.keys()].find((id) => !active.has(id));
      if (!oldest) break;
      statuses.delete(oldest);
    }
    statuses.set(key, { value, expires: now() + (value.state === 'paused' ? 25 * 60 * 60 * 1000 : limits.ttlMs) });
  };
  return {
    available,
    async startIndexing(options, ctx) {
      const { owner, repo, commitSha, includePaths = [], excludePaths = [] } = options;
      const key = searchIndexKey(owner, repo, commitSha, ctx, includePaths, excludePaths);
      const prior = statuses.get(key)?.value;
      if (prior?.state === 'paused' && prior.retryAt && prior.retryAt > now()) return;
      if (active.has(key)) throw new AppError(409, 'Indexing is already in progress.', 'INDEXING_IN_PROGRESS');
      if (active.size >= limits.concurrentJobs)
        throw new AppError(429, 'Search indexing is busy. Please retry later.', 'INDEXING_BUSY', true);
      const job = { cancelled: false };
      active.set(key, job);
      const check = () => {
        if (job.cancelled) throw new AppError(409, 'Indexing was cancelled.', 'INDEXING_CANCELLED');
      };
      save(key, {
        state: 'indexing',
        progress: 0,
        filesProcessed: 0,
        totalFiles: 0,
      });
      try {
        const store = deps.getVectorStore();
        if (store.hasIndex(key)) {
          save(key, {
            state: 'complete',
            chunkCount: store.getChunkCount(key),
            timestamp: now(),
          });
          return;
        }
        const { indexed, totalFiles } = await buildSnapshot(
          deps,
          limits,
          key,
          options,
          ctx,
          checkpoints,
          check,
          (status) => save(key, status),
        );
        store.replaceIndex(key, indexed);
        checkpoints.remove(key);
        publish(key, { kind: 'complete', commitSha, indexedFiles: totalFiles, totalFiles });
        save(key, {
          state: 'complete',
          chunkCount: indexed.length,
          timestamp: now(),
        });
      } catch (error) {
        const failure =
          error instanceof AppError
            ? error
            : new AppError(502, 'Repository indexing failed. Please retry.', 'INDEXING_FAILED', true);
        const checkpoint = checkpoints.get(key);
        if (job.cancelled) {
          checkpoints.remove(key);
          save(key, { state: 'idle' });
          return;
        }
        if (failure.retryable && (checkpoint || failure.status === 429)) {
          const seconds = failure.context?.retryAfterSeconds;
          save(key, {
            state: 'paused',
            error: failure.message,
            reason: failure.code,
            retryAt: typeof seconds === 'number' ? now() + seconds * 1000 : undefined,
            filesProcessed: checkpoint?.completed.size ?? 0,
            totalFiles: checkpoint?.totalFiles ?? 0,
            progress: checkpoint?.totalFiles
              ? Math.round((checkpoint.completed.size / checkpoint.totalFiles) * 100)
              : 0,
          });
          return;
        }
        checkpoints.remove(key);
        save(key, { state: 'failed', error: failure.message, failedFiles: 0 });
        // Log the sanitized AppError payload, not the raw provider/network
        // error — logError serializes error.message/stack verbatim (URLs, keys, fragments).
        logError('/api/search/index', toErrorPayload(failure), { repo: owner + '/' + repo });
        throw failure;
      } finally {
        active.delete(key);
      }
    },
    getStatus(key) {
      const entry = statuses.get(key);
      if (entry && (active.has(key) || entry.expires > now())) {
        if (entry.value.state !== 'complete' || deps.getVectorStore().hasIndex(key))
          return { ...entry.value, coverage: available(key)?.coverage };
      }
      statuses.delete(key);
      if (deps.getVectorStore().hasIndex(key))
        return {
          state: 'complete',
          chunkCount: deps.getVectorStore().getChunkCount(key),
          timestamp: now(),
        };
      return { state: 'idle', coverage: available(key)?.coverage };
    },
    cancelIndexing(key) {
      const job = active.get(key);
      if (job)
        job.cancelled = true; // Keep the slot until the awaited operation settles.
      else {
        checkpoints.remove(key);
        statuses.delete(key);
      }
    },
  };
}
let globalPipeline: IndexingPipeline | null = null;
export function getIndexingPipeline(): IndexingPipeline {
  return (globalPipeline ??= createIndexingPipeline());
}
