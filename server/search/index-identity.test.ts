import { test, expect } from 'bun:test';
import { searchIndexKey } from './index-identity';

test('index identity isolates credentials, snapshots and embedding models without exposing tokens', () => {
  const key = searchIndexKey('Org', 'Repo', 'sha', { gitHubToken: 'private-token' });
  expect(key).not.toContain('private-token');
  expect(key).toBe(searchIndexKey('org', 'repo', 'sha', { gitHubToken: 'private-token' }));
  expect(key).not.toBe(searchIndexKey('org', 'repo', 'sha2', { gitHubToken: 'private-token' }));
  expect(key).not.toBe(searchIndexKey('org', 'repo', 'sha', { gitHubToken: 'other' }));
  const original = process.env.OPENAI_EMBEDDING_MODEL;
  try {
    process.env.OPENAI_EMBEDDING_MODEL = 'different-model';
    expect(key).not.toBe(searchIndexKey('org', 'repo', 'sha', { gitHubToken: 'private-token' }));
  } finally {
    if (original === undefined) delete process.env.OPENAI_EMBEDDING_MODEL;
    else process.env.OPENAI_EMBEDDING_MODEL = original;
  }
});
