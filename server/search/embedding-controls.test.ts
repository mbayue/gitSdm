import { expect, test } from 'bun:test';
import { protectEmbeddings } from './embedding-controls';
import type { EmbeddingProvider } from './types';
import { AppError } from '../utils/errors';

test('embedding budget charges actual attempts instead of hypothetical retries', async () => {
  const charges: number[] = [];
  let attempts = 0;
  const provider: EmbeddingProvider = {
    providerName: 'test',
    dimensions: 1,
    maxTokens: 100,
    embed: async () => {
      if (++attempts === 2) throw new Error('timeout');
      return { vector: new Float32Array([1]), tokenCount: 1 };
    },
    embedBatch: async () => [],
  };
  const protectedProvider = protectEmbeddings(provider, async (_kind, bytes) => {
    charges.push(bytes);
  });
  await protectedProvider.embed('hello');
  expect(charges).toEqual([5]);
  await protectedProvider.embed('hello');
  expect(attempts).toBe(3);
  expect(charges).toEqual([5, 5, 5]);
});

test('a timeout retry honors cooldown from another request without reserving more budget', async () => {
  let releaseTimeout!: () => void;
  const timeoutGate = new Promise<void>((resolve) => {
    releaseTimeout = resolve;
  });
  let attempts = 0;
  let reservations = 0;
  const provider: EmbeddingProvider = {
    providerName: 'test',
    dimensions: 1,
    maxTokens: 100,
    embed: async (text) => {
      if (text === 'timeout') {
        attempts++;
        await timeoutGate;
        throw new Error('timeout');
      }
      throw new AppError(429, 'Cooling down', 'EMBEDDING_RATE_LIMITED', true, { retryAfterSeconds: 2 });
    },
    embedBatch: async () => [],
  };
  const protectedProvider = protectEmbeddings(provider, async () => {
    reservations++;
  });
  const pending = protectedProvider.embed('timeout').then(
    () => null,
    (error: unknown) => error,
  );
  await expect(protectedProvider.embed('limited')).rejects.toMatchObject({ code: 'EMBEDDING_RATE_LIMITED' });
  releaseTimeout();
  expect(await pending).toMatchObject({ code: 'EMBEDDING_RATE_LIMITED' });
  expect(attempts).toBe(1);
  expect(reservations).toBe(2);
  await new Promise((resolve) => setTimeout(resolve, 2100));
}, 10000);

test('a delayed reservation cannot dispatch after another request starts a cooldown', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let reservations = 0;
  const dispatched: string[] = [];
  const provider: EmbeddingProvider = {
    providerName: 'test',
    dimensions: 1,
    maxTokens: 100,
    embed: async (text) => {
      dispatched.push(text);
      throw new AppError(429, 'Cooling down', 'EMBEDDING_RATE_LIMITED', true, { retryAfterSeconds: 2 });
    },
    embedBatch: async () => [],
  };
  const protectedProvider = protectEmbeddings(provider, async () => {
    if (++reservations === 1) await gate;
  });
  const delayed = protectedProvider.embed('delayed').then(
    () => null,
    (error: unknown) => error,
  );
  await expect(protectedProvider.embed('limited')).rejects.toMatchObject({ code: 'EMBEDDING_RATE_LIMITED' });
  release();
  expect(await delayed).toMatchObject({ code: 'EMBEDDING_RATE_LIMITED' });
  expect(dispatched).toEqual(['limited']);
  await new Promise((resolve) => setTimeout(resolve, 2100));
}, 10000);
