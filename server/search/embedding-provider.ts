import { protectEmbeddings } from './embedding-controls';
import type { EmbeddingProvider, EmbeddingResult } from './types';
import { EMBEDDING_DIMENSIONS } from './constants';
import { AppError } from '../utils/errors';
import { hashToken } from '../cache/lru';
import { embeddingIdentity } from './index-identity';

// ── Factory ────────────────────────────────────────────────────────────

let cachedProvider: EmbeddingProvider | null = null;
let cachedProviderKey: string | null = null;

export async function createEmbeddingProvider(): Promise<EmbeddingProvider> {
  const envProvider = (process.env.EMBEDDING_PROVIDER ?? process.env.AI_PROVIDER ?? 'mock').toLowerCase();
  const cacheKey =
    embeddingIdentity() +
    hashToken(
      JSON.stringify([
        process.env.OPENAI_API_KEY,
        process.env.GEMINI_API_KEY,
        process.env.EDGEONE_API_KEY,
        process.env.MAKERS_MODELS_KEY,
      ]),
    );

  if (cachedProvider && cachedProviderKey === cacheKey) {
    return cachedProvider;
  }

  let provider: EmbeddingProvider;

  if (envProvider === 'openai') {
    provider = createOpenAIEmbeddingProvider();
  } else if (envProvider === 'edgeone') {
    provider = await createEdgeOneEmbeddingFallback();
  } else if (envProvider === 'gemini') {
    provider = await createGeminiEmbeddingProvider();
  } else if (envProvider === 'anthropic') {
    // Anthropic has no native embedding API – prefer Gemini, then try OpenAI
    if (process.env.GEMINI_API_KEY) {
      provider = await createGeminiEmbeddingProvider();
    } else if (process.env.OPENAI_API_KEY) {
      provider = createOpenAIEmbeddingProvider();
    } else {
      throw new AppError(
        400,
        'Anthropic does not support embeddings. Configure OPENAI_API_KEY or GEMINI_API_KEY as fallback.',
        'EMBEDDING_PROVIDER_UNAVAILABLE',
      );
    }
  } else {
    provider = createMockEmbeddingProvider();
  }

  provider = provider.providerName === 'mock' ? provider : protectEmbeddings(provider);
  cachedProvider = provider;
  cachedProviderKey = cacheKey;
  return provider;
}

// ── Mock Provider ──────────────────────────────────────────────────────

function createMockEmbeddingProvider(): EmbeddingProvider {
  return {
    dimensions: EMBEDDING_DIMENSIONS,
    maxTokens: Infinity,
    providerName: 'mock',

    async embed(text: string): Promise<EmbeddingResult> {
      const vector = deterministicEmbedding(text, EMBEDDING_DIMENSIONS);
      return { vector, tokenCount: estimateTokens(text) };
    },

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
      return texts.map((t) => ({
        vector: deterministicEmbedding(t, EMBEDDING_DIMENSIONS),
        tokenCount: estimateTokens(t),
      }));
    },
  };
}

/** Deterministic hash-based pseudo-embedding (same input → same output). */
function deterministicEmbedding(text: string, dims: number): Float32Array {
  const vec = new Float32Array(dims);
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  for (let i = 0; i < dims; i++) {
    h ^= i;
    h = Math.imul(h, 0x01000193);
    vec[i] = (h >>> 0) / 0xffffffff - 0.5;
  }
  // Normalize to unit length
  let norm = 0;
  for (let i = 0; i < dims; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < dims; i++) vec[i] /= norm;
  return vec;
}

// ── OpenAI-compatible Provider ────────────────────────────────────────

interface OpenAICompatibleConfig {
  providerName: string;
  apiKey: string;
  baseURL?: string;
  model: string;
}

function createOpenAICompatibleEmbeddingProvider(config: OpenAICompatibleConfig): EmbeddingProvider {
  const { providerName, apiKey, baseURL, model } = config;
  const maxTokens = 8191;

  return {
    dimensions: EMBEDDING_DIMENSIONS,
    maxTokens,
    providerName,

    async embed(text: string, signal?: AbortSignal): Promise<EmbeddingResult> {
      const truncated = truncateText(text, maxTokens);
      const vector = await openAIEmbed(apiKey, model, truncated, baseURL, signal);
      return { vector, tokenCount: estimateTokens(truncated) };
    },

    async embedBatch(texts: string[], signal?: AbortSignal): Promise<EmbeddingResult[]> {
      const truncated = texts.map((t) => truncateText(t, maxTokens));
      const vectors = await openAIEmbedBatch(apiKey, model, truncated, baseURL, signal);
      return vectors.map((v, i) => ({
        vector: v,
        tokenCount: estimateTokens(truncated[i]),
      }));
    },
  };
}

function createOpenAIEmbeddingProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(401, 'OPENAI_API_KEY is required for OpenAI embeddings.', 'MISSING_API_KEY');
  }

  return createOpenAICompatibleEmbeddingProvider({
    providerName: 'openai',
    apiKey,
    model: process.env.OPENAI_EMBEDDING_MODEL ?? 'openrouter/openai/text-embedding-3-large',
  });
}

async function createEdgeOneEmbeddingFallback(): Promise<EmbeddingProvider> {
  if (process.env.GEMINI_API_KEY) return createGeminiEmbeddingProvider();
  if (process.env.OPENAI_API_KEY) return createOpenAIEmbeddingProvider();
  throw new AppError(
    400,
    'EdgeOne does not provide embeddings. Configure GEMINI_API_KEY or OPENAI_API_KEY for semantic search.',
    'EMBEDDING_PROVIDER_UNAVAILABLE',
  );
}

async function openAIEmbed(
  apiKey: string,
  model: string,
  text: string,
  baseURL?: string,
  signal?: AbortSignal,
): Promise<Float32Array> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey,
    baseURL: baseURL ?? process.env.OPENAI_API_BASE,
    timeout: 30000,
    maxRetries: 0,
  });

  const response = await client.embeddings.create(
    {
      model,
      dimensions: EMBEDDING_DIMENSIONS,
      input: text,
      encoding_format: 'float',
    },
    { signal },
  );

  return normalizeVector(new Float32Array(response.data[0].embedding));
}

async function openAIEmbedBatch(
  apiKey: string,
  model: string,
  texts: string[],
  baseURL?: string,
  signal?: AbortSignal,
): Promise<Float32Array[]> {
  if (texts.length === 0) return [];
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey,
    baseURL: baseURL ?? process.env.OPENAI_API_BASE,
    timeout: 30000,
    maxRetries: 0,
  });

  // OpenAI supports batch – send in chunks of 100
  const results: Float32Array[] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await client.embeddings.create(
      {
        model,
        dimensions: EMBEDDING_DIMENSIONS,
        input: batch,
        encoding_format: 'float',
      },
      { signal },
    );
    for (const item of response.data) {
      results.push(normalizeVector(new Float32Array(item.embedding)));
    }
  }
  return results;
}

// ── Gemini Provider ────────────────────────────────────────────────────

async function createGeminiEmbeddingProvider(): Promise<EmbeddingProvider> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(401, 'GEMINI_API_KEY is required for Gemini embeddings.', 'MISSING_API_KEY');
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 30000, retryOptions: { attempts: 1 } },
  });
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001';
  const maxTokens = 2048;

  return {
    dimensions: EMBEDDING_DIMENSIONS,
    maxTokens,
    providerName: 'gemini',

    async embed(text: string, signal?: AbortSignal): Promise<EmbeddingResult> {
      const truncated = truncateText(text, maxTokens);
      const response = await ai.models.embedContent({
        model,
        contents: truncated,
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          abortSignal: signal,
        },
      });
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) throw new AppError(503, 'Gemini returned no embedding.', 'EMBEDDING_FAILURE', true);
      return {
        vector: normalizeVector(new Float32Array(embedding)),
        tokenCount: estimateTokens(truncated),
      };
    },

    async embedBatch(texts: string[], signal?: AbortSignal): Promise<EmbeddingResult[]> {
      // Gemini accepts up to 100 contents per request; avoid one request per chunk.
      const batchSize = 100;
      const results: EmbeddingResult[] = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        const truncated = texts.slice(i, i + batchSize).map((text) => truncateText(text, maxTokens));
        const response = await ai.models.embedContent({
          model,
          contents: truncated,
          config: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
            abortSignal: signal,
          },
        });
        const embeddings = response.embeddings;
        if (!embeddings || embeddings.length !== truncated.length) {
          throw new AppError(503, 'Gemini returned an incomplete embedding batch.', 'EMBEDDING_FAILURE', true);
        }
        for (let j = 0; j < embeddings.length; j++) {
          const embedding = embeddings[j].values;
          if (!embedding) {
            throw new AppError(503, 'Gemini returned no embedding.', 'EMBEDDING_FAILURE', true);
          }
          results.push({
            vector: normalizeVector(new Float32Array(embedding)),
            tokenCount: estimateTokens(truncated[j]),
          });
        }
      }
      return results;
    },
  };
}

// ── Utilities ──────────────────────────────────────────────────────────

function normalizeVector(v: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

/** Rough token estimation: ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Truncate text to approximate max token count. */
function truncateText(text: string, maxTokens: number): string {
  const approxChars = maxTokens * 4;
  if (text.length <= approxChars) return text;
  return text.slice(0, approxChars);
}
