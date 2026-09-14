import { test, expect } from 'bun:test';
import { protectAI } from './provider-controls';
import { protectEmbeddings } from '../search/embedding-controls';

test('server-funded AI is blocked at zero budget, while a user key can still run', async () => {
  const previous = process.env.SERVER_AI_DAILY_CALLS;
  process.env.SERVER_AI_DAILY_CALLS = '0';
  let called = 0;
  const provider = {
    complete: async () => {
      called++;
      return 'answer';
    },
  };
  try {
    await expect(protectAI(provider, true).complete([{ role: 'user', content: 'hello' }])).rejects.toMatchObject({
      code: 'USAGE_LIMIT_EXCEEDED',
    });
    expect(called).toBe(0);
    expect(await protectAI(provider, false).complete([{ role: 'user', content: 'hello' }])).toBe('answer');
    expect(called).toBe(1);
    await expect(
      protectAI(provider, false).complete([{ role: 'user', content: 'x'.repeat(64001) }]),
    ).rejects.toMatchObject({ status: 413 });
  } finally {
    if (previous === undefined) delete process.env.SERVER_AI_DAILY_CALLS;
    else process.env.SERVER_AI_DAILY_CALLS = previous;
  }
});

test('embedding budget is checked before invoking the provider', async () => {
  const previous = process.env.SERVER_EMBEDDING_DAILY_BYTES;
  process.env.SERVER_EMBEDDING_DAILY_BYTES = '0';
  let called = false;
  const embed = async () => {
    called = true;
    return { vector: new Float32Array([1]), tokenCount: 1 };
  };
  const provider = protectEmbeddings({
    dimensions: 1,
    maxTokens: 512,
    providerName: 'test',
    embed,
    embedBatch: async () => [await embed()],
  });
  try {
    await expect(provider.embed('hello')).rejects.toMatchObject({ code: 'USAGE_LIMIT_EXCEEDED' });
    expect(called).toBe(false);
  } finally {
    if (previous === undefined) delete process.env.SERVER_EMBEDDING_DAILY_BYTES;
    else process.env.SERVER_EMBEDDING_DAILY_BYTES = previous;
  }
});
