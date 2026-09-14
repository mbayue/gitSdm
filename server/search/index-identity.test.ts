import { test, expect } from 'bun:test';
import { searchIndexKey, searchIndexIdentity } from './index-identity';

test('snapshot families retain credential and path isolation', () => {
  const key = (sha: string, token = 'one', paths: string[] = []) =>
    searchIndexKey('org', 'repo', sha, { gitHubToken: token }, paths);
  expect(searchIndexIdentity(key('first')).snapshotSha).toBe('first');
  expect(searchIndexIdentity(key('first')).family).toBe(searchIndexIdentity(key('second')).family);
  expect(searchIndexIdentity(key('first')).family).not.toBe(searchIndexIdentity(key('first', 'other')).family);
  expect(searchIndexIdentity(key('first')).family).not.toBe(searchIndexIdentity(key('first', 'one', ['src'])).family);
  expect(() => searchIndexIdentity('invalid')).toThrow();
});

test('index identity isolates credentials, snapshots and embedding models without exposing tokens', () => {
  const key = searchIndexKey('Org', 'Repo', 'sha', { gitHubToken: 'private-token' });
  expect(key).not.toContain('private-token');
  expect(key).toBe(searchIndexKey('org', 'repo', 'sha', { gitHubToken: 'private-token' }));
  expect(key).not.toBe(searchIndexKey('org', 'repo', 'sha2', { gitHubToken: 'private-token' }));
  expect(key).not.toBe(searchIndexKey('org', 'repo', 'sha', { gitHubToken: 'other' }));
  const original = process.env.EMBEDDING_MODEL;
  try {
    process.env.EMBEDDING_MODEL = 'different-model';
    expect(key).not.toBe(searchIndexKey('org', 'repo', 'sha', { gitHubToken: 'private-token' }));
  } finally {
    if (original === undefined) delete process.env.EMBEDDING_MODEL;
    else process.env.EMBEDDING_MODEL = original;
  }
});

test('Featherless model changes invalidate existing search indexes', () => {
  const previous = process.env.EMBEDDING_MODEL;
  try {
    process.env.EMBEDDING_MODEL = 'Qwen/Qwen3-Embedding-8B';
    const key = searchIndexKey('org', 'repo', 'sha');
    process.env.EMBEDDING_MODEL = 'different-model';
    expect(searchIndexKey('org', 'repo', 'sha')).not.toBe(key);
  } finally {
    if (previous === undefined) delete process.env.EMBEDDING_MODEL;
    else process.env.EMBEDDING_MODEL = previous;
  }
});
