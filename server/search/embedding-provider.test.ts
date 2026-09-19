import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createEmbeddingProvider } from './embedding-provider';
import { fetchPublicEmbeddings } from '../ai/public-chat-fetch';

const realSetTimeout = globalThis.setTimeout;
const originalEmbeddingProvider = process.env.EMBEDDING_PROVIDER;
const dedicatedNames = ['EMBEDDING_API_KEY', 'EMBEDDING_API_BASE', 'EMBEDDING_MODEL'] as const;
const dedicatedValues = dedicatedNames.map(name => process.env[name]);
const originalEmbeddingInterval = process.env.EMBEDDING_REQUEST_INTERVAL_MS;

let openAIError: Error | null = null;
let geminiFailures = 0;
let geminiRequests = 0;
let openAIConfig: { apiKey: string; baseURL?: string; fetch?: typeof fetchPublicEmbeddings } | undefined;

describe('createEmbeddingProvider', () => {
  it('uses the normalized base URL for single and batch embeddings', async () => {
    const originalBase = process.env.OPENAI_API_BASE;
    try {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_API_BASE = '   ';
      const provider = await createEmbeddingProvider();
      await provider.embed('one');
      expect(openAIConfig?.baseURL).toBeUndefined();
      expect(openAIConfig?.fetch).toBe(fetchPublicEmbeddings);
      await provider.embedBatch(['two']);
      expect(openAIConfig?.baseURL).toBeUndefined();
      expect(openAIConfig?.fetch).toBe(fetchPublicEmbeddings);
    } finally {
      if (originalBase === undefined) delete process.env.OPENAI_API_BASE;
      else process.env.OPENAI_API_BASE = originalBase;
    }
  });
  beforeEach(() => {
    process.env.EMBEDDING_REQUEST_INTERVAL_MS = '0';
    delete process.env.EMBEDDING_PROVIDER;
    dedicatedNames.forEach(name => { delete process.env[name]; });
    mock.module('openai', () => {
      class OpenAI {
        baseURL = '';
        embeddings = {
          create: mock(async ({ input }: { input: string | string[] }) => {
            if (openAIError) throw openAIError;
            const one = { embedding: [3, 4, 0] };
            const many = Array.isArray(input) ? input.map(() => one) : [one];
            return { data: many };
          }),
        };

        constructor(config: { apiKey: string; baseURL?: string }) {
          openAIConfig = config;
        }
      }

      return { default: OpenAI };
    });

    mock.module('@google/genai', () => ({
      GoogleGenAI: class {
        models = {
          embedContent: mock(async ({ contents }: { contents: string | string[] }) => {
            geminiRequests++;
            if (geminiFailures > 0) {
              geminiFailures--;
              throw new Error('timeout');
            }
            const texts = Array.isArray(contents) ? contents : [contents];
            return {
              embeddings: texts.includes('missing') ? [] : texts.map(() => ({ values: [0, 3, 4] })),
            };
          }),
        };

        constructor(_config: { apiKey: string }) {}
      },
    }));

    process.env.AI_PROVIDER = 'mock';
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_EMBEDDING_MODEL;
    delete process.env.GEMINI_EMBEDDING_MODEL;
    openAIError = null;
    geminiFailures = 0;
    geminiRequests = 0;
  });

  afterEach(() => {
    dedicatedNames.forEach((name, i) => { if (dedicatedValues[i] === undefined) delete process.env[name]; else process.env[name] = dedicatedValues[i]; });
    if (originalEmbeddingInterval === undefined) delete process.env.EMBEDDING_REQUEST_INTERVAL_MS;
    else process.env.EMBEDDING_REQUEST_INTERVAL_MS = originalEmbeddingInterval;
    if (originalEmbeddingProvider === undefined) delete process.env.EMBEDDING_PROVIDER;
    else process.env.EMBEDDING_PROVIDER = originalEmbeddingProvider;
    mock.restore();
  });

  it('uses dedicated embedding credentials and endpoint instead of chat settings', async () => {
    const names = ['EMBEDDING_API_KEY', 'EMBEDDING_API_BASE', 'EMBEDDING_MODEL', 'OPENAI_API_BASE'] as const;
    const saved = names.map((name) => process.env[name]);
    try {
      process.env.EMBEDDING_PROVIDER = 'openai';
      process.env.EMBEDDING_API_KEY = 'embedding-only';
      process.env.EMBEDDING_API_BASE = 'https://embedding.example/v1';
      process.env.EMBEDDING_MODEL = 'embed-test';
      process.env.OPENAI_API_BASE = 'https://chat.example/v1';
      const provider = await createEmbeddingProvider();
      await provider.embed('example');
      expect(openAIConfig).toMatchObject({ apiKey: 'embedding-only', baseURL: 'https://embedding.example/v1' });
    } finally {
      names.forEach((name, index) => {
        if (saved[index] === undefined) delete process.env[name];
        else process.env[name] = saved[index];
      });
    }
  });

  it('sends a Gemini chunk batch in one provider request', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-batch-regression';
    const provider = await createEmbeddingProvider();
    const results = await provider.embedBatch(Array.from({ length: 32 }, (_, i) => `chunk ${i}`));
    expect(results).toHaveLength(32);
    expect(geminiRequests).toBe(1);
  });

  it('uses Featherless credentials and endpoint independently of the AI provider', async () => {
    const previous = process.env.OPENAI_API_BASE;
    try {
      process.env.EMBEDDING_PROVIDER = 'openai';
      process.env.AI_PROVIDER = 'anthropic';
      process.env.OPENAI_API_KEY = 'unit-featherless-key';
      process.env.OPENAI_API_BASE = 'https://api.featherless.ai/v1';
      const provider = await createEmbeddingProvider();
      expect(provider.providerName).toBe('openai');
      await provider.embedBatch(['search']);
      expect(openAIConfig).toEqual(
        expect.objectContaining({
          apiKey: 'unit-featherless-key',
          baseURL: 'https://api.featherless.ai/v1',
        }),
      );
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_BASE;
      else process.env.OPENAI_API_BASE = previous;
    }
  });

  it('creates deterministic mock embeddings and caches provider', async () => {
    const p1 = await createEmbeddingProvider();
    const p2 = await createEmbeddingProvider();

    expect(p1).toBe(p2);
    expect(p1.providerName).toBe('mock');
    expect(p1.maxTokens).toBe(Infinity);

    const a = await p1.embed('hello world');
    const b = await p1.embed('hello world');

    expect(a.tokenCount).toBe(3);
    expect(Array.from(a.vector)).toEqual(Array.from(b.vector));
  });

  it('embeds batches with token counts', async () => {
    const provider = await createEmbeddingProvider();
    const batch = await provider.embedBatch(['abcd', 'abcdefgh']);

    expect(batch).toHaveLength(2);
    expect(batch[0].tokenCount).toBe(1);
    expect(batch[1].tokenCount).toBe(2);
  });

  it('throws when anthropic embeddings have no fallback key', async () => {
    process.env.AI_PROVIDER = 'anthropic';

    await expect(createEmbeddingProvider()).rejects.toMatchObject({
      status: 400,
      code: 'EMBEDDING_PROVIDER_UNAVAILABLE',
    });
  });

  it('throws when openai provider has no key', async () => {
    process.env.AI_PROVIDER = 'openai';

    await expect(createEmbeddingProvider()).rejects.toMatchObject({
      status: 401,
      code: 'MISSING_API_KEY',
    });
  });

  it('uses openai embeddings and batch empty path', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.OPENAI_API_BASE = 'https://example.test';

    const provider = await createEmbeddingProvider();
    expect(provider.providerName).toBe('openai');
    expect(provider.maxTokens).toBe(8191);

    const one = await provider.embed('hello');
    expect(one.tokenCount).toBe(2);
    expect(Math.round(one.vector[0] * 10) / 10).toBe(0.6);

    expect(await provider.embedBatch([])).toEqual([]);

    const batch = await provider.embedBatch(['a', 'b']);
    expect(batch).toHaveLength(2);

    delete process.env.OPENAI_API_BASE;
  });

  it('uses gemini embeddings and batch path', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-key';

    const provider = await createEmbeddingProvider();
    expect(provider.providerName).toBe('gemini');

    const one = await provider.embed('hello');
    expect(one.tokenCount).toBe(2);
    expect(Math.round(one.vector[2] * 10) / 10).toBe(0.8);

    const batch = await provider.embedBatch(['a', 'b']);
    expect(batch).toHaveLength(2);
  });

  it('throws when gemini returns no embedding', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-key-2';

    const provider = await createEmbeddingProvider();

    await expect(provider.embed('missing')).rejects.toMatchObject({
      status: 503,
      code: 'EMBEDDING_FAILURE',
    });
  });

  it('uses anthropic fallback providers', async () => {
    process.env.AI_PROVIDER = 'anthropic';
    process.env.GEMINI_API_KEY = 'gemini-fallback';

    expect((await createEmbeddingProvider()).providerName).toBe('gemini');

    process.env.AI_PROVIDER = 'anthropic';
    delete process.env.GEMINI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-fallback';

    expect((await createEmbeddingProvider()).providerName).toBe('openai');
  });

  it('truncates long openai input before token counting', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-truncate';

    const provider = await createEmbeddingProvider();
    const result = await provider.embed('x'.repeat(provider.maxTokens * 4 + 10));

    expect(result.tokenCount).toBe(provider.maxTokens);
  });

  it('retries transient gemini timeouts', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-retry';
    geminiFailures = 1;

    const provider = await createEmbeddingProvider();
    spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void, delay = 0) => {
      if (delay >= 10000) return realSetTimeout(callback, delay);
      callback();
      return 0;
    }) as typeof setTimeout);
    const result = await provider.embed('retry me');

    expect(Math.round(result.vector[2] * 10) / 10).toBe(0.8);
  });

  it('throws immediately for non-retryable embedding errors', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-boom';
    openAIError = new Error('boom');

    const provider = await createEmbeddingProvider();

    await expect(provider.embed('hello')).rejects.toThrow('boom');
  });

  it('throws after retry budget is exhausted', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-exhaust';
    geminiFailures = 3;

    const provider = await createEmbeddingProvider();
    spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void, delay = 0) => {
      if (delay >= 10000) return realSetTimeout(callback, delay);
      callback();
      return 0;
    }) as typeof setTimeout);

    await expect(provider.embed('retry exhausted')).rejects.toThrow('timeout');
  });

  it('throws when gemini provider has no key', async () => {
    process.env.AI_PROVIDER = 'gemini';

    await expect(createEmbeddingProvider()).rejects.toMatchObject({
      status: 401,
      code: 'MISSING_API_KEY',
    });
  });
});
