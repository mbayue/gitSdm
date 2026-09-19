import { expect, test } from 'bun:test';
import { chatIdentity, chatOverrides, readChatOverrides, resolveChatConfig } from './chat-config';

test('custom URLs require a user key and a valid HTTPS endpoint', () => {
  const headers = new Headers({
    'x-ai-provider': 'openai',
    'x-ai-base-url': 'https://api.openai.com/v1',
    'x-ai-model': 'custom-model',
  });
  expect(() => readChatOverrides(headers)).toThrow('own API key');
  expect(readChatOverrides(headers, 'user-key').model).toBe('custom-model');
  for (const url of ['http://127.0.0.1/v1', 'https://api.openai.com/v1?redirect=1']) {
    headers.set('x-ai-base-url', url);
    expect(() => readChatOverrides(headers, 'user-key')).toThrow();
  }
});

test('concurrent request overrides stay isolated and distinguish cache identities', async () => {
  const run = (model: string) =>
    chatOverrides.run({ provider: 'openai', model, baseURL: 'https://api.openai.com/v1' }, async () => {
      await Promise.resolve();
      return { config: resolveChatConfig('custom-key'), identity: chatIdentity('custom-key') };
    });
  const [a, b] = await Promise.all([run('model-a'), run('model-b')]);
  expect(a.config.model).toBe('model-a');
  expect(b.config.model).toBe('model-b');
  expect(a.identity).not.toBe(b.identity);
  expect(a.identity).not.toContain('custom-key');
});

test('endpoint and credential changes invalidate chat identity', () => {
  const a = chatOverrides.run({ provider: 'openai', baseURL: 'https://one.example/v1' }, () => chatIdentity('key-one'));
  const b = chatOverrides.run({ provider: 'openai', baseURL: 'https://two.example/v1' }, () => chatIdentity('key-one'));
  const c = chatOverrides.run({ provider: 'openai', baseURL: 'https://one.example/v1' }, () => chatIdentity('key-two'));
  expect(a).not.toBe(b);
  expect(a).not.toBe(c);
});
