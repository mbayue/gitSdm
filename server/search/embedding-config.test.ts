import { expect, test } from 'bun:test';
import { embeddingConfig } from './embedding-config';

test('blank dedicated settings use nonempty legacy settings', () => {
  expect(
    embeddingConfig({
      EMBEDDING_PROVIDER: ' ',
      AI_PROVIDER: 'openai',
      EMBEDDING_API_KEY: '',
      EMBEDDING_API_BASE: ' ',
      EMBEDDING_MODEL: '',
      OPENAI_API_KEY: ' key ',
      OPENAI_API_BASE: 'https://legacy.example/v1',
      OPENAI_EMBEDDING_MODEL: 'model',
    }),
  ).toMatchObject({ provider: 'openai', apiKey: 'key', baseURL: 'https://legacy.example/v1', model: 'model' });
});

test('explicit embedding configuration is independent of chat settings', () => {
  const env = {
    EMBEDDING_PROVIDER: 'openai',
    EMBEDDING_API_KEY: 'embedding-key',
    EMBEDDING_API_BASE: 'https://embedding.example/v1',
    EMBEDDING_MODEL: 'embed-model',
  };
  expect(
    embeddingConfig({
      ...env,
      AI_PROVIDER: 'anthropic',
      OPENAI_API_KEY: 'chat-key',
      OPENAI_API_BASE: 'https://chat.example/v1',
    }),
  ).toEqual(embeddingConfig({ ...env, AI_PROVIDER: 'gemini' }));
});

test('existing OpenAI settings remain supported', () => {
  expect(
    embeddingConfig({
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'key',
      OPENAI_API_BASE: 'https://legacy.example/v1',
      OPENAI_EMBEDDING_MODEL: 'legacy-model',
    }),
  ).toEqual({ provider: 'openai', apiKey: 'key', baseURL: 'https://legacy.example/v1', model: 'legacy-model' });
});

test('non-HTTPS or private embedding endpoints fail closed before the key is used', () => {
  for (const base of ['http://embeddings.example/v1', 'https://10.0.0.5/v1', 'https://169.254.169.254/v1']) {
    for (const env of [
      { AI_PROVIDER: 'openai', OPENAI_API_KEY: 'key', OPENAI_API_BASE: base },
      { EMBEDDING_PROVIDER: 'openai', EMBEDDING_API_KEY: 'key', EMBEDDING_API_BASE: base },
    ]) {
      let error: unknown;
      try {
        embeddingConfig(env);
      } catch (err) {
        error = err;
      }
      expect(error).toMatchObject({ code: 'EMBEDDING_PROVIDER_UNAVAILABLE' });
    }
  }
});
