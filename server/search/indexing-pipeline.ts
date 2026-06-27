import type { IndexingOptions, IndexingStatus, IndexingPipeline, RequestContext, IndexedChunk } from './types';
import { SUPPORTED_EXTENSIONS, extToLanguage } from './constants';
import { createEmbeddingProvider } from './embedding-provider';
import { createChunker } from './chunker';
import pLimit from 'p-limit';
import { getVectorStore } from './vector-store';
import { fetchFlatTree, fetchFileContents, fetchRepoInfo } from '../github/fetch-tree';
import { invalidateSearchCache } from '../cache/lru';
import { AppError } from '../utils/errors';
import { logError } from '../utils/logger';

function repoKey(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

/** Tracks per-repo indexing status. */
const statusMap = new Map<string, IndexingStatus>();
const activeIndexing = new Set<string>(); // prevents concurrent indexing

export function createIndexingPipeline(): IndexingPipeline {
  return {
    async startIndexing(options: IndexingOptions, ctx: RequestContext): Promise<void> {
      const key = repoKey(options.owner, options.repo);

      // Prevent concurrent indexing
      if (activeIndexing.has(key)) {
        throw new AppError(409, 'Indexing already in progress for this repository.', 'INDEXING_IN_PROGRESS');
      }

      activeIndexing.add(key);
      statusMap.set(key, { state: 'indexing', progress: 0, filesProcessed: 0, totalFiles: 0 });

      try {
        await runIndexing(options, ctx, key);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        statusMap.set(key, { state: 'failed', error: msg, failedFiles: 0 });
        logError('/api/search/index', err, { repo: key });
      } finally {
        activeIndexing.delete(key);
      }
    },

    getStatus(key: string): IndexingStatus {
      return statusMap.get(key) ?? { state: 'idle' };
    },

    cancelIndexing(key: string): void {
      activeIndexing.delete(key);
      statusMap.set(key, { state: 'idle' });
    },
  };
}

async function runIndexing(options: IndexingOptions, ctx: RequestContext, key: string): Promise<void> {
  const { owner, repo, commitSha, previousSha } = options;
  const vectorStore = getVectorStore();

  // Idempotent: if same SHA already indexed, skip
  if (vectorStore.hasIndex(key) && !previousSha) {
    // Check if existing index matches this SHA – we can't easily verify, so re-index only if not present
    const existingCount = vectorStore.getChunkCount(key);
    if (existingCount > 0) {
      statusMap.set(key, { state: 'complete', chunkCount: existingCount, timestamp: Date.now() });
      return;
    }
  }

  // 1. Fetch the file tree first so we can report totalFiles early
  const info = await fetchRepoInfo(owner, repo, options.branch, ctx);
  const targetSha = commitSha || info.sha;
  const { items } = await fetchFlatTree(owner, repo, targetSha, ctx);

  // 2. Filter to supported extensions
  const sourceFiles = items.filter((item) => {
    const ext = getExtension(item.path);
    return SUPPORTED_EXTENSIONS.has(ext);
  });

  const totalFiles = sourceFiles.length;
  statusMap.set(key, { state: 'indexing', progress: 0, filesProcessed: 0, totalFiles });

  // 3. Create embedding provider (may fail on proxy issues)
  const provider = await createEmbeddingProvider();
  const chunker = createChunker();

  // 4. Determine files to process (incremental: only changed files)
  let filesToProcess = sourceFiles;
  let filesToDelete: string[] = [];

  if (previousSha && vectorStore.hasIndex(key)) {
    const { items: prevItems } = await fetchFlatTree(owner, repo, previousSha, ctx);
    const prevFiles = new Set(
      prevItems.filter((i) => SUPPORTED_EXTENSIONS.has(getExtension(i.path))).map((i) => i.path),
    );
    const currFiles = new Set(sourceFiles.map((i) => i.path));

    // Files in current but not prev, or SHA changed → treat as modified
    // Files in prev but not current → delete
    filesToDelete = [...prevFiles].filter((f) => !currFiles.has(f));
    const modifiedOrAdded = sourceFiles.filter((item) => {
      const prevItem = prevItems.find((p) => p.path === item.path);
      return !prevItem || prevItem.sha !== item.sha; // SHA changed or new file
    });
    filesToProcess = modifiedOrAdded;

    // Remove deleted files from store
    for (const filePath of filesToDelete) {
      vectorStore.removeByFile(key, filePath);
    }
  } else {
    // Full re-index: clear existing
    vectorStore.removeByRepo(key);
  }

  // 5. Fetch file contents and process in batches
  const BATCH_SIZE = 10;
  let filesProcessed = 0;
  let failedChunks = 0;
  let totalChunks = 0;
  const allIndexedChunks: IndexedChunk[] = [];

  // Limit concurrency across all GitHub API requests to 5.
  // We apply this per file processing task to prevent `fetchFileContents`
  // fanout within batches from exceeding our limit.
  const limit = pLimit(5);
  const batches: (typeof filesToProcess)[] = [];
  for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
    batches.push(filesToProcess.slice(i, i + BATCH_SIZE));
  }

  await Promise.all(
    batches.map((batch) => {
      const paths = batch.map((b) => b.path);

      return limit(async () => {
        let contents: Record<string, string>;
        try {
          contents = await fetchFileContents(owner, repo, paths, targetSha, ctx);
        } catch {
          failedChunks += batch.length;
          filesProcessed += batch.length;
          return;
        }

        for (const item of batch) {
          const content = contents[item.path];
          if (!content) {
            failedChunks++;
            filesProcessed++;
            continue;
          }

          const ext = getExtension(item.path);
          const language = extToLanguage(ext);
          const chunks = chunker.chunkFile(content, item.path, language);

          if (chunks.length === 0) {
            filesProcessed++;
            continue;
          }

          totalChunks += chunks.length;

          // Embed chunks
          try {
            const chunkContents = new Array(chunks.length);
            for (let j = 0; j < chunks.length; j++) {
              chunkContents[j] = chunks[j].content;
            }
            const embeddings = await provider.embedBatch(chunkContents);

            for (let j = 0; j < chunks.length; j++) {
              const chunk = chunks[j];
              const embedding = embeddings[j];
              allIndexedChunks.push({
                id: `${key}:${item.path}:${chunk.chunkIndex}`,
                vector: embedding.vector,
                metadata: {
                  filePath: item.path,
                  startLine: chunk.startLine,
                  endLine: chunk.endLine,
                  chunkIndex: chunk.chunkIndex,
                  language: chunk.language,
                  content: chunk.content.slice(0, 2000), // Limit stored content for display
                  repoKey: key,
                  commitSha: targetSha,
                },
              });
            }
          } catch (err) {
            failedChunks++;
            logError('indexing:embed', err, { file: item.path });
          }

          filesProcessed++;
        }

        // Update progress
        const progress = totalFiles > 0 ? Math.round((filesProcessed / totalFiles) * 100) : 100;
        statusMap.set(key, { state: 'indexing', progress, filesProcessed, totalFiles });
      });
    }),
  );

  // 6. Check failure threshold
  const totalAttempted = totalChunks + failedChunks;
  if (totalAttempted > 0 && failedChunks / totalAttempted > 0.1) {
    statusMap.set(key, {
      state: 'failed',
      error: `Indexing aborted: ${failedChunks} of ${totalAttempted} chunks failed (>10% threshold)`,
      failedFiles: failedChunks,
    });
    return;
  }

  // 7. Store all chunks
  vectorStore.addChunks(allIndexedChunks);

  // 8. Invalidate search cache for this repo (SHA changed)
  invalidateSearchCache(owner, repo);

  statusMap.set(key, {
    state: 'complete',
    chunkCount: vectorStore.getChunkCount(key),
    timestamp: Date.now(),
  });
}

function getExtension(path: string): string {
  const dot = path.lastIndexOf('.');
  if (dot < 0) return '';
  return path.slice(dot).toLowerCase();
}

// ── Singleton ──────────────────────────────────────────────────────────

let globalPipeline: IndexingPipeline | null = null;

export function getIndexingPipeline(): IndexingPipeline {
  if (!globalPipeline) {
    globalPipeline = createIndexingPipeline();
  }
  return globalPipeline;
}
