import type { SearchEngine, SearchOptions, SearchResponse } from './types';
import { DEFAULT_TOP_K, DEFAULT_MIN_SCORE } from './constants';
import { searchIndexKey } from './index-identity';
import { createEmbeddingProvider } from './embedding-provider';
import { getVectorStore } from './vector-store';
import { cache } from '../cache/lru';
import { hashContext } from '../cache/lru';
import { AppError } from '../utils/errors';
import { getIndexingPipeline } from './indexing-pipeline';

export function createSearchEngine(
  deps = { createEmbeddingProvider, getVectorStore },
  resolveAvailable = (key: string) => getIndexingPipeline().available(key),
): SearchEngine {
  return {
    async search(options: SearchOptions): Promise<SearchResponse> {
      const { query, owner, repo, commitSha } = options;
      const topK = options.topK ?? DEFAULT_TOP_K;
      const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
      const requestedKey = searchIndexKey(owner, repo, commitSha, options, options.includePaths, options.excludePaths);

      // Validate query length
      if (query.length < 3 || query.length > 500) {
        throw new AppError(400, 'Query must be between 3 and 500 characters.', 'INVALID_QUERY_LENGTH');
      }

      // Check if index exists
      const available = resolveAvailable(requestedKey);
      const vectorStore = deps.getVectorStore().hasIndex(requestedKey)
        ? deps.getVectorStore()
        : (available?.store ?? deps.getVectorStore());
      const repoKey = vectorStore === available?.store ? available.key : requestedKey;
      const coverage = available?.coverage;
      if (!vectorStore.hasIndex(repoKey)) {
        throw new AppError(404, 'No index found. Please index the repository first.', 'INDEX_NOT_FOUND');
      }

      // Check cache
      const queryHash = hashContext(query);
      const cacheKey = `search:${repoKey}${repoKey === requestedKey ? '' : ':' + requestedKey}:${queryHash}:${topK}:${minScore}`;
      const cached = coverage?.kind === 'partial' ? undefined : cache.get<SearchResponse>(cacheKey);
      if (cached) {
        return { ...cached, coverage, cached: true };
      }

      // Generate embedding for query
      const provider = await deps.createEmbeddingProvider();
      let embeddingResult;
      try {
        embeddingResult = await provider.embed(query);
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(503, 'Search temporarily unavailable. Please retry.', 'EMBEDDING_FAILURE', true);
      }

      // Search vector store
      if (!vectorStore.hasIndex(repoKey)) {
        throw new AppError(404, 'Search index expired. Please rebuild it.', 'INDEX_NOT_FOUND');
      }
      const results = vectorStore.search(embeddingResult.vector, repoKey, topK, minScore);

      const response: SearchResponse = {
        results,
        query,
        cached: false,
        coverage,
      };

      // Store in cache
      if (coverage?.kind !== 'partial') cache.set(cacheKey, response);

      return response;
    },
  };
}

// ── Singleton ──────────────────────────────────────────────────────────

let globalEngine: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (!globalEngine) {
    globalEngine = createSearchEngine();
  }
  return globalEngine;
}
