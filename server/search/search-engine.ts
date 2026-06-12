import type { SearchEngine, SearchOptions, SearchResponse } from './types';
import { DEFAULT_TOP_K, DEFAULT_MIN_SCORE, searchCacheKey } from './constants';
import { createEmbeddingProvider } from './embedding-provider';
import { getVectorStore } from './vector-store';
import { cache } from '../cache/lru';
import { hashContext } from '../cache/lru';
import { AppError } from '../utils/errors';

export function createSearchEngine(): SearchEngine {
  return {
    async search(options: SearchOptions): Promise<SearchResponse> {
      const { query, owner, repo, commitSha } = options;
      const topK = options.topK ?? DEFAULT_TOP_K;
      const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
      const repoKey = `${owner}/${repo}`;

      // Validate query length
      if (query.length < 3 || query.length > 500) {
        throw new AppError(
          400,
          'Query must be between 3 and 500 characters.',
          'INVALID_QUERY_LENGTH',
        );
      }

      // Check if index exists
      const vectorStore = getVectorStore();
      if (!vectorStore.hasIndex(repoKey)) {
        throw new AppError(
          404,
          'No index found. Please index the repository first.',
          'INDEX_NOT_FOUND',
        );
      }

      // Check cache
      const queryHash = hashContext(query);
      const cacheKey = searchCacheKey(owner, repo, commitSha, queryHash);
      const cached = cache.get<SearchResponse>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      // Generate embedding for query
      const provider = await createEmbeddingProvider();
      let embeddingResult;
      try {
        embeddingResult = await provider.embed(query);
      } catch {
        throw new AppError(
          503,
          'Search temporarily unavailable. Please retry.',
          'EMBEDDING_FAILURE',
          true,
        );
      }

      // Search vector store
      const results = vectorStore.search(embeddingResult.vector, repoKey, topK, minScore);

      const response: SearchResponse = {
        results,
        query,
        cached: false,
      };

      // Store in cache
      cache.set(cacheKey, response);

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
