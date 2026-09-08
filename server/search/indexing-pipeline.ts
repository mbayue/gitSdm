import type { IndexingStatus, IndexingPipeline, IndexedChunk } from './types';
import { SUPPORTED_EXTENSIONS, extToLanguage } from './constants';
import { createEmbeddingProvider } from './embedding-provider';
import { createChunker } from './chunker';
import { getVectorStore, chunkBytes } from './vector-store';
import { fetchFlatTree, fetchFileContents } from '../github/fetch-tree';
import { AppError } from '../utils/errors';
import { logError } from '../utils/logger';
import { searchIndexKey } from './index-identity';
import { SEARCH_LIMITS } from './limits';

const defaults = { fetchFlatTree, fetchFileContents, createEmbeddingProvider, createChunker, getVectorStore };
export function createIndexingPipeline(deps = defaults, limits = SEARCH_LIMITS, now = Date.now): IndexingPipeline {
  const statuses = new Map<string, { value: IndexingStatus; expires: number }>();
  const active = new Map<string, { cancelled: boolean }>();
  const save = (key: string, value: IndexingStatus) => {
    for (const [id, entry] of statuses) if (entry.expires <= now() && !active.has(id)) statuses.delete(id);
    statuses.delete(key);
    while (statuses.size >= limits.statuses) {
      const oldest = [...statuses.keys()].find((id) => !active.has(id));
      if (!oldest) break;
      statuses.delete(oldest);
    }
    statuses.set(key, { value, expires: now() + limits.ttlMs });
  };
  return {
    async startIndexing(options, ctx) {
      const { owner, repo, commitSha } = options;
      const key = searchIndexKey(owner, repo, commitSha, ctx);
      if (active.has(key)) throw new AppError(409, 'Indexing is already in progress.', 'INDEXING_IN_PROGRESS');
      if (active.size >= limits.concurrentJobs)
        throw new AppError(429, 'Search indexing is busy. Please retry later.', 'INDEXING_BUSY', true);
      const job = { cancelled: false };
      active.set(key, job);
      const check = () => {
        if (job.cancelled) throw new AppError(409, 'Indexing was cancelled.', 'INDEXING_CANCELLED');
      };
      save(key, { state: 'indexing', progress: 0, filesProcessed: 0, totalFiles: 0 });
      try {
        const store = deps.getVectorStore();
        if (store.hasIndex(key)) {
          save(key, { state: 'complete', chunkCount: store.getChunkCount(key), timestamp: now() });
          return;
        }
        const tree = await deps.fetchFlatTree(owner, repo, commitSha, ctx);
        check();
        const files = tree.items.filter((item) => SUPPORTED_EXTENSIONS.has(extension(item.path)));
        if (tree.truncated || files.length > limits.files || files.some((file) => (file.size ?? 0) > limits.fileBytes))
          throw new AppError(413, 'Repository exceeds search indexing file limits.', 'INDEX_TOO_LARGE');
        const provider = await deps.createEmbeddingProvider();
        const chunker = deps.createChunker();
        const indexed: IndexedChunk[] = [];
        let bytes = 0;
        let processed = 0;
        // Fetch one bounded file at a time; never accumulate the repository's source text.
        for (const file of files) {
          check();
          const contents = await deps.fetchFileContents(owner, repo, [file.path], commitSha, ctx, limits.fileBytes);
          check();
          const content = contents[file.path];
          if (content === undefined)
            throw new AppError(502, 'A repository file could not be read.', 'INDEXING_FAILED', true);
          if (Buffer.byteLength(content, 'utf8') > limits.fileBytes)
            throw new AppError(413, 'A file exceeds the search indexing size limit.', 'INDEX_TOO_LARGE');
          const chunks = chunker.chunkFile(content, file.path, extToLanguage(extension(file.path)), {
            maxChunks: limits.chunks - indexed.length,
            maxBytes: limits.indexBytes - bytes,
            bytesPerChunk: provider.dimensions * 4 + 4 * (key.length + file.path.length) + 1024,
          });
          if (indexed.length + chunks.length > limits.chunks)
            throw new AppError(413, 'Repository exceeds the search chunk limit.', 'INDEX_TOO_LARGE');
          // Reserve conservatively before paying for embeddings or retaining their vectors.
          const estimated = chunks.reduce(
            (sum, chunk) =>
              sum + provider.dimensions * 4 + 2 * (chunk.content.length + key.length * 2 + file.path.length * 2) + 1024,
            0,
          );
          if (bytes + estimated > limits.indexBytes)
            throw new AppError(413, 'Repository exceeds the search index memory limit.', 'INDEX_TOO_LARGE');
          for (let offset = 0; offset < chunks.length; offset += 32) {
            check();
            const batch = chunks.slice(offset, offset + 32);
            const embeddings = await provider.embedBatch(batch.map((chunk) => chunk.content));
            check();
            if (embeddings.length !== batch.length)
              throw new AppError(502, 'Embedding provider returned an incomplete batch.', 'INDEXING_FAILED', true);
            for (let i = 0; i < batch.length; i++) {
              const chunk = batch[i];
              const vector = embeddings[i].vector;
              if (vector.length !== provider.dimensions || !vector.every(Number.isFinite))
                throw new AppError(502, 'Embedding provider returned an invalid vector.', 'INDEXING_FAILED', true);
              const entry: IndexedChunk = {
                id: key + ':' + file.path + ':' + chunk.chunkIndex,
                vector,
                metadata: {
                  filePath: file.path,
                  startLine: chunk.startLine,
                  endLine: chunk.endLine,
                  chunkIndex: chunk.chunkIndex,
                  language: chunk.language,
                  content: chunk.content.slice(0, 2000),
                  repoKey: key,
                  commitSha,
                },
              };
              bytes += chunkBytes(entry);
              if (bytes > limits.indexBytes)
                throw new AppError(413, 'Search index memory limit exceeded.', 'INDEX_TOO_LARGE');
              indexed.push(entry);
            }
          }
          processed++;
          save(key, {
            state: 'indexing',
            progress: Math.round((processed / files.length) * 100),
            filesProcessed: processed,
            totalFiles: files.length,
          });
        }
        check();
        store.replaceIndex(key, indexed);
        save(key, { state: 'complete', chunkCount: indexed.length, timestamp: now() });
      } catch (error) {
        const failure =
          error instanceof AppError
            ? error
            : new AppError(502, 'Repository indexing failed. Please retry.', 'INDEXING_FAILED', true);
        save(key, { state: 'failed', error: failure.message, failedFiles: 0 });
        logError('/api/search/index', error, { repo: owner + '/' + repo });
        throw failure;
      } finally {
        active.delete(key);
      }
    },
    getStatus(key) {
      const entry = statuses.get(key);
      if (entry && (active.has(key) || entry.expires > now())) {
        if (entry.value.state !== 'complete' || deps.getVectorStore().hasIndex(key)) return entry.value;
      }
      statuses.delete(key);
      if (deps.getVectorStore().hasIndex(key))
        return { state: 'complete', chunkCount: deps.getVectorStore().getChunkCount(key), timestamp: now() };
      return { state: 'idle' };
    },
    cancelIndexing(key) {
      const job = active.get(key);
      if (job) job.cancelled = true; // Keep the slot until the awaited operation settles.
    },
  };
}
function extension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot < 0 ? '' : path.slice(dot).toLowerCase();
}
let globalPipeline: IndexingPipeline | null = null;
export function getIndexingPipeline(): IndexingPipeline {
  return (globalPipeline ??= createIndexingPipeline());
}
