import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createEmbeddingProvider } from './embedding-provider';

let openAIError: Error | null = null;
let geminiFailures = 0;

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

    constructor(_config: { apiKey: string }) {}
  }

  return { default: OpenAI };
});

mock.module('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      embedContent: mock(async ({ contents }: { contents: string }) => {
        if (geminiFailures > 0) {
          geminiFailures--;
          throw new Error('timeout');
        }
        return {
          embeddings: contents === 'missing' ? [] : [{ values: [0, 3, 4] }],
        };
      }),
    };

    constructor(_config: { apiKey: string }) {}
  },
}));

describe('createEmbeddingProvider', () => {
  beforeEach(() => {
    process.env.AI_PROVIDER = 'mock';
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_EMBEDDING_MODEL;
    delete process.env.GEMINI_EMBEDDING_MODEL;
    openAIError = null;
    geminiFailures = 0;
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
    spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
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
    spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
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
