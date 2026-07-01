import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import { cache, clearAllCaches } from '../cache/lru';
import {
  fetchNpmDependencyMetadata,
  fetchNpmDependencyMetadataBatch,
  npmDependencyHealthCacheKey,
} from './npm-registry';

const originalFetch = globalThis.fetch;

describe('services/npm-registry', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  it('fetches latest version and license, then caches successful metadata for 24h', async () => {
    const fetchMock = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '2.0.0' },
      license: { type: 'MIT' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const first = await fetchNpmDependencyMetadata('left-pad', '1.0.0');
    const second = await fetchNpmDependencyMetadata('left-pad', '1.0.0');

    expect(first).toEqual({
      status: 'outdated',
      currentVersion: '1.0.0',
      latestVersion: '2.0.0',
      license: 'MIT',
      checkedAt: first.checkedAt,
    });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cache.has(npmDependencyHealthCacheKey('left-pad'))).toBe(true);
  });

  it('returns typed error metadata for missing latest, 404, invalid shape, invalid JSON, and network failure', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('missing-latest')) {
        return new Response(JSON.stringify({ name: 'missing-latest', 'dist-tags': {} }), { status: 200 });
      }

      if (url.includes('not-found')) {
        return new Response('not found', { status: 404 });
      }

      if (url.includes('bad-shape')) {
        return new Response(JSON.stringify({ name: 'bad-shape' }), { status: 200 });
      }

      if (url.includes('bad-json')) {
        return new Response('{', { status: 200 });
      }

      throw new TypeError('network down');
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await expect(fetchNpmDependencyMetadata('missing-latest')).resolves.toEqual(expect.objectContaining({
      kind: 'missing-latest',
      packageName: 'missing-latest',
    }));
    await expect(fetchNpmDependencyMetadata('not-found')).resolves.toEqual(expect.objectContaining({
      kind: 'not-found',
      packageName: 'not-found',
    }));
    await expect(fetchNpmDependencyMetadata('bad-shape')).resolves.toEqual(expect.objectContaining({
      kind: 'invalid-shape',
      packageName: 'bad-shape',
    }));
    await expect(fetchNpmDependencyMetadata('bad-json')).resolves.toEqual(expect.objectContaining({
      kind: 'invalid-json',
      packageName: 'bad-json',
    }));
    await expect(fetchNpmDependencyMetadata('offline')).resolves.toEqual(expect.objectContaining({
      kind: 'network-error',
      packageName: 'offline',
    }));
  });

  it('batches package requests in chunks of 10 and keeps per-package failures local', async () => {
    let active = 0;
    let peak = 0;
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      active += 1;
      peak = Math.max(peak, active);

      try {
        const name = decodeURIComponent(new URL(String(input)).pathname.replace('/%40', '@').slice('/'.length));
        if (name === 'pkg-11' || name === 'pkg-12') {
          return new Response(JSON.stringify({ name, 'dist-tags': {} }), { status: 200 });
        }

        return new Response(JSON.stringify({
          name,
          'dist-tags': { latest: `1.0.${name.split('-').at(-1)}` },
          license: 'Apache-2.0',
        }), { status: 200 });
      } finally {
        active -= 1;
      }
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await fetchNpmDependencyMetadataBatch([
      'pkg-1', 'pkg-2', 'pkg-3', 'pkg-4', 'pkg-5', 'pkg-6', 'pkg-7', 'pkg-8', 'pkg-9', 'pkg-10', 'pkg-11', 'pkg-12',
    ].map((name) => ({ ecosystem: 'npm' as const, name, type: 'prod' as const, version: '^1.0.0' })));

    expect(peak).toBeLessThanOrEqual(10);
    expect(result['npm:pkg-1:^1.0.0:prod']).toMatchObject({ status: 'outdated', currentVersion: '1.0.0', latestVersion: '1.0.1', license: 'Apache-2.0' });
    expect(result['npm:pkg-11:^1.0.0:prod']).toMatchObject({ status: 'error', error: 'missing latest version' });
    expect(result['npm:pkg-12:^1.0.0:prod']).toMatchObject({ status: 'error', error: 'missing latest version' });
  });

  it('correctly compares SemVer versions with prerelease identifiers and build metadata', async () => {
    const fetchMock = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-x-y-z.--+build123' },
      license: 'MIT',
    }), { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const meta = await fetchNpmDependencyMetadata('test-pkg', '1.0.0-x-y-z.--');
    expect(meta).toEqual({
      status: 'current',
      currentVersion: '1.0.0-x-y-z.--',
      latestVersion: '1.0.0-x-y-z.--+build123',
      license: 'MIT',
      checkedAt: meta.checkedAt,
    });
  });
});
