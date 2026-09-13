import type { IndexingOptions, IndexingStatus, IndexedChunk, Chunk, RequestContext } from './types';
import { SUPPORTED_EXTENSIONS, extToLanguage } from './constants';
import { createEmbeddingProvider } from './embedding-provider';
import { createChunker } from './chunker';
import { getVectorStore, chunkBytes } from './vector-store';
import { createCheckpoints } from './checkpoints';
import { fetchFlatTree, fetchFileContents } from '../github/fetch-tree';
import { AppError } from '../utils/errors';
import { SEARCH_LIMITS } from './limits';

export const indexingDependencies = {
  fetchFlatTree,
  fetchFileContents,
  createEmbeddingProvider,
  createChunker,
  getVectorStore,
};
export async function buildSnapshot(
  deps: typeof indexingDependencies,
  limits: typeof SEARCH_LIMITS,
  key: string,
  options: IndexingOptions,
  ctx: RequestContext,
  checkpoints: ReturnType<typeof createCheckpoints>,
  check: () => void,
  report: (status: IndexingStatus) => void,
) {
  const { owner, repo, commitSha, includePaths = [], excludePaths = [] } = options;
  const tree = await deps.fetchFlatTree(owner, repo, commitSha, ctx);
  check();
  const files = tree.items.filter(
    (item) =>
      SUPPORTED_EXTENSIONS.has(extension(item.path)) &&
      (includePaths.length === 0 || includePaths.some((prefix) => matchesPath(item.path, prefix))) &&
      !excludePaths.some((prefix) => matchesPath(item.path, prefix)),
  );
  if (tree.truncated || files.length > limits.files || files.some((file) => (file.size ?? 0) > limits.fileBytes))
    throw new AppError(413, 'Repository exceeds search indexing file limits.', 'INDEX_TOO_LARGE');
  const provider = await deps.createEmbeddingProvider();
  const chunker = deps.createChunker();
  const checkpoint = checkpoints.get(key);
  const indexed: IndexedChunk[] = [...(checkpoint?.chunks ?? [])];
  const completed = new Set(checkpoint?.completed ?? []);
  const embedded = new Set(indexed.map((chunk) => chunk.metadata.filePath + ':' + chunk.metadata.chunkIndex));
  let bytes = checkpoint?.bytes ?? 0;
  let processed = completed.size;
  let pending: Array<{ chunk: Chunk; lastInFile: boolean }> = [];
  let pendingBytes = 0;
  let pendingMemory = 0;
  const reportProgress = () =>
    report({
      state: 'indexing',
      progress: files.length ? Math.round((processed / files.length) * 100) : 0,
      filesProcessed: processed,
      totalFiles: files.length,
    });
  const estimateChunk = (chunk: Chunk) =>
    provider.dimensions * 4 + 2 * (chunk.content.length + key.length * 2 + chunk.filePath.length * 2) + 1024;
  const flush = async () => {
    if (!pending.length) return;
    check();
    const embeddings = await provider.embedBatch(pending.map(({ chunk }) => chunk.content));
    check();
    if (embeddings.length !== pending.length)
      throw new AppError(502, 'Embedding provider returned an incomplete batch.', 'INDEXING_FAILED', true);
    if (embeddings.some(({ vector }) => vector.length !== provider.dimensions || !vector.every(Number.isFinite)))
      throw new AppError(502, 'Embedding provider returned an invalid vector.', 'INDEXING_FAILED', true);
    for (let i = 0; i < pending.length; i++) {
      const { chunk, lastInFile } = pending[i];
      const vector = embeddings[i].vector;
      if (vector.length !== provider.dimensions || !vector.every(Number.isFinite))
        throw new AppError(502, 'Embedding provider returned an invalid vector.', 'INDEXING_FAILED', true);
      const entry: IndexedChunk = {
        id: key + ':' + chunk.filePath + ':' + chunk.chunkIndex,
        vector,
        metadata: {
          filePath: chunk.filePath,
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
      if (bytes > limits.indexBytes) throw new AppError(413, 'Search index memory limit exceeded.', 'INDEX_TOO_LARGE');
      indexed.push(entry);
      if (lastInFile) {
        completed.add(chunk.filePath);
        processed++;
      }
    }
    checkpoints.save(key, indexed, completed, files.length);
    pending = [];
    pendingBytes = 0;
    pendingMemory = 0;
    reportProgress();
  };
  reportProgress();
  checkpoints.save(key, indexed, completed, files.length);
  // Four files in flight, at most 1 MiB of source per group with the default file cap.
  for (let offset = 0; offset < files.length; offset += 4) {
    const group = files.slice(offset, offset + 4).filter((file) => !completed.has(file.path));
    if (!group.length) continue;
    check();
    const contents = await deps.fetchFileContents(
      owner,
      repo,
      group.map((file) => file.path),
      commitSha,
      ctx,
      limits.fileBytes,
    );
    check();
    for (const file of group) {
      const content = contents[file.path];
      if (content === undefined)
        throw new AppError(502, 'A repository file could not be read.', 'INDEXING_FAILED', true);
      if (Buffer.byteLength(content, 'utf8') > limits.fileBytes)
        throw new AppError(413, 'A file exceeds the search indexing size limit.', 'INDEX_TOO_LARGE');
      const chunks = chunker
        .chunkFile(content, file.path, extToLanguage(extension(file.path)), {
          maxChunks: limits.chunks,
          maxBytes: limits.indexBytes,
          bytesPerChunk: provider.dimensions * 4 + 4 * (key.length + file.path.length) + 1024,
        })
        .filter((chunk) => !embedded.has(chunk.filePath + ':' + chunk.chunkIndex));
      if (indexed.length + pending.length + chunks.length > limits.chunks)
        throw new AppError(413, 'Repository exceeds the search chunk limit.', 'INDEX_TOO_LARGE');
      // Reserve conservatively before paying for embeddings or retaining their vectors.
      const estimated = chunks.reduce((sum, chunk) => sum + estimateChunk(chunk), 0);
      if (bytes + pendingMemory + estimated > limits.indexBytes)
        throw new AppError(413, 'Repository exceeds the search index memory limit.', 'INDEX_TOO_LARGE');
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const size = Buffer.byteLength(chunk.content, 'utf8');
        if (size > 256000) throw new AppError(413, 'Embedding chunk is too large.', 'INDEX_TOO_LARGE');
        if (pending.length && (pending.length >= 32 || pendingBytes + size > 256000)) await flush();
        pending.push({ chunk, lastInFile: i === chunks.length - 1 });
        pendingBytes += size;
        pendingMemory += estimateChunk(chunk);
        if (pending.length === 32) await flush();
      }
      if (!chunks.length) {
        completed.add(file.path);
        processed++;
        checkpoints.save(key, indexed, completed, files.length);
        reportProgress();
      }
    }
  }
  await flush();
  check();
  return { indexed, totalFiles: files.length };
}
function extension(path: string): string {
  const base = path.split('/').pop()?.toLowerCase();
  if (base === 'dockerfile') return '.dockerfile';
  const dot = path.lastIndexOf('.');
  return dot < 0 ? '' : path.slice(dot).toLowerCase();
}
function matchesPath(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}
