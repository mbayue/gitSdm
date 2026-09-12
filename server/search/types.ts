import type { RequestContext } from '../utils/context';
import type { SearchCoverage } from './coverage';

// ── Embedding ──────────────────────────────────────────────────────────

export interface EmbeddingResult {
  vector: Float32Array; // normalized to unit length
  tokenCount: number;
}

export interface EmbeddingProvider {
  embed(text: string, signal?: AbortSignal): Promise<EmbeddingResult>;
  embedBatch(texts: string[], signal?: AbortSignal): Promise<EmbeddingResult[]>;
  readonly dimensions: number;
  readonly maxTokens: number;
  readonly providerName: string;
}

// ── Vector Store ───────────────────────────────────────────────────────

export interface ChunkMetadata {
  filePath: string;
  startLine: number;
  endLine: number;
  chunkIndex: number; // ordinal position within the file
  language: string;
  content: string; // raw code content for display
  repoKey: string; // "owner/repo"
  commitSha: string;
}

export interface IndexedChunk {
  id: string; // unique chunk identifier
  vector: Float32Array;
  metadata: ChunkMetadata;
}

export interface SearchResult {
  chunk: ChunkMetadata;
  score: number; // cosine similarity 0.0 - 1.0
}

export interface VectorStore {
  replaceIndex(repoKey: string, chunks: IndexedChunk[]): void;
  addChunks(chunks: IndexedChunk[]): void;
  removeByRepo(repoKey: string): void;
  removeByFile(repoKey: string, filePath: string): void;
  search(queryVector: Float32Array, repoKey: string, topK: number, minScore: number): SearchResult[];
  getChunkCount(repoKey: string): number;
  hasIndex(repoKey: string): boolean;
}

// ── Indexing ───────────────────────────────────────────────────────────

export interface IndexingOptions {
  owner: string;
  repo: string;
  branch?: string;
  commitSha: string;
  previousSha?: string; // for incremental re-indexing
  includePaths?: string[];
  excludePaths?: string[];
}

export type IndexingStatus = (
  | { state: 'idle' }
  | {
      state: 'indexing';
      progress: number;
      filesProcessed: number;
      totalFiles: number;
    }
  | { state: 'complete'; chunkCount: number; timestamp: number }
  | {
      state: 'paused';
      error: string;
      reason: string;
      retryAt?: number;
      filesProcessed: number;
      totalFiles: number;
      progress: number;
    }
  | { state: 'failed'; error: string; failedFiles: number }
) & { coverage?: SearchCoverage; snapshotSha?: string; buildId?: string };

export interface IndexingPipeline {
  startIndexing(options: IndexingOptions, ctx: RequestContext): Promise<void>;
  getStatus(repoKey: string): IndexingStatus;
  cancelIndexing(repoKey: string): void;
  available(repoKey: string): { store: VectorStore; key: string; coverage: SearchCoverage } | undefined;
}

// ── Search Engine ──────────────────────────────────────────────────────

export interface SearchOptions {
  gitHubToken?: string;
  query: string;
  owner: string;
  repo: string;
  commitSha: string;
  topK?: number; // default 10
  minScore?: number; // default 0.3
  includePaths?: string[];
  excludePaths?: string[];
}

export interface SearchResponse {
  coverage?: SearchCoverage;
  results: SearchResult[];
  query: string;
  cached: boolean;
}

export interface SearchEngine {
  search(options: SearchOptions): Promise<SearchResponse>;
}

// ── QA Engine ──────────────────────────────────────────────────────────

export interface QAOptions {
  gitHubToken?: string;
  question: string;
  owner: string;
  repo: string;
  commitSha: string;
  apiKey?: string; // user override key
  includePaths?: string[];
  excludePaths?: string[];
}

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
}

export interface QAResponse {
  coverage?: SearchCoverage;
  answer: string; // markdown-formatted
  citations: Citation[];
  cached: boolean;
}

export interface QAEngine {
  ask(options: QAOptions): Promise<QAResponse>;
}

// ── Chunker ────────────────────────────────────────────────────────────

export interface Chunk {
  content: string;
  startLine: number;
  endLine: number;
  chunkIndex: number;
  language: string;
  filePath: string;
}

export interface Chunker {
  chunkFile(
    content: string,
    filePath: string,
    language: string,
    budget?: {
      maxChunks: number;
      maxBytes: number;
      bytesPerChunk: number;
    },
  ): Chunk[];
}

export type { RequestContext };
