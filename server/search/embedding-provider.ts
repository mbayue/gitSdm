import type { EmbeddingProvider, EmbeddingResult } from './types';
import { EMBEDDING_DIMENSIONS } from './constants';
import { AppError } from '../utils/errors';

// ── Factory ────────────────────────────────────────────────────────────

let cachedProvider: EmbeddingProvider | null = null;
let cachedProviderKey: string | null = null;

export async function createEmbeddingProvider(): Promise<EmbeddingProvider> {
  const envProvider = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();
  const cacheKey = `${envProvider}:${process.env.GEMINI_API_KEY ? 'g' : ''}${process.env.OPENAI_API_KEY ? 'o' : ''}`;

  if (cachedProvider && cachedProviderKey === cacheKey) {
    return cachedProvider;
  }

  let provider: EmbeddingProvider;

  if (envProvider === 'openai') {
    provider = createOpenAIEmbeddingProvider();
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

// ── OpenAI Provider ────────────────────────────────────────────────────

function createOpenAIEmbeddingProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(401, 'OPENAI_API_KEY is required for OpenAI embeddings.', 'MISSING_API_KEY');
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL ?? 'openrouter/openai/text-embedding-3-large';
  const maxTokens = 8191;

  return {
    dimensions: EMBEDDING_DIMENSIONS,
    maxTokens,
    providerName: 'openai',

    async embed(text: string): Promise<EmbeddingResult> {
      const truncated = truncateText(text, maxTokens);
      const vector = await openAIEmbed(apiKey, model, truncated);
      return { vector, tokenCount: estimateTokens(truncated) };
    },

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
      const truncated = texts.map((t) => truncateText(t, maxTokens));
      const vectors = await openAIEmbedBatch(apiKey, model, truncated);
      return vectors.map((v, i) => ({ vector: v, tokenCount: estimateTokens(truncated[i]) }));
    },
  };
}

async function openAIEmbed(apiKey: string, model: string, text: string): Promise<Float32Array> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });
  if (process.env.OPENAI_API_BASE) {
    client.baseURL = process.env.OPENAI_API_BASE;
  }

  const response = await withRetry(() =>
    client.embeddings.create({
      model,
      input: text,
    }),
  );

  return normalizeVector(new Float32Array(response.data[0].embedding));
}

async function openAIEmbedBatch(apiKey: string, model: string, texts: string[]): Promise<Float32Array[]> {
  if (texts.length === 0) return [];
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });
  if (process.env.OPENAI_API_BASE) {
    client.baseURL = process.env.OPENAI_API_BASE;
  }

  // OpenAI supports batch – send in chunks of 100
  const results: Float32Array[] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await withRetry(() =>
      client.embeddings.create({
        model,
        input: batch,
      }),
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
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001';
  const maxTokens = 2048;

  return {
    dimensions: EMBEDDING_DIMENSIONS,
    maxTokens,
    providerName: 'gemini',

    async embed(text: string): Promise<EmbeddingResult> {
      const truncated = truncateText(text, maxTokens);
      const response = await withRetry(() =>
        ai.models.embedContent({
          model,
          contents: truncated,
          config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        }),
      );
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) throw new AppError(503, 'Gemini returned no embedding.', 'EMBEDDING_FAILURE', true);
      return {
        vector: normalizeVector(new Float32Array(embedding)),
        tokenCount: estimateTokens(truncated),
      };
    },

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
      const results: EmbeddingResult[] = [];
      for (const text of texts) {
        const truncated = truncateText(text, maxTokens);
        const response = await withRetry(() =>
          ai.models.embedContent({
            model,
            contents: truncated,
            config: { outputDimensionality: EMBEDDING_DIMENSIONS },
          }),
        );
        const embedding = response.embeddings?.[0]?.values;
        if (!embedding) throw new AppError(503, 'Gemini returned no embedding.', 'EMBEDDING_FAILURE', true);
        results.push({
          vector: normalizeVector(new Float32Array(embedding)),
          tokenCount: estimateTokens(truncated),
        });
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

/** Exponential backoff retry for rate limits and transient errors. */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit');
      const isTimeout = msg.toLowerCase().includes('timeout');
      if (!isRateLimit && !isTimeout) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
