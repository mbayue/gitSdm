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

      if (url.includes('primitive-shape')) {
        return new Response(JSON.stringify('primitive'), { status: 200 });
      }

      if (url.includes('bad-json')) {
        return new Response('{', { status: 200 });
      }

      if (url.includes('server-error')) {
        return new Response('internal error', { status: 500 });
      }

      if (url.includes('empty-latest')) {
        return new Response(JSON.stringify({ name: 'empty-latest', 'dist-tags': { latest: '' } }), { status: 200 });
      }

      throw new TypeError('network down');
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await expect(fetchNpmDependencyMetadata('missing-latest')).resolves.toEqual(expect.objectContaining({
      kind: 'missing-latest',
      packageName: 'missing-latest',
    }));
    await expect(fetchNpmDependencyMetadata('empty-latest')).resolves.toEqual(expect.objectContaining({
      kind: 'missing-latest',
      packageName: 'empty-latest',
    }));
    await expect(fetchNpmDependencyMetadata('not-found')).resolves.toEqual(expect.objectContaining({
      kind: 'not-found',
      packageName: 'not-found',
    }));
    await expect(fetchNpmDependencyMetadata('server-error')).resolves.toEqual(expect.objectContaining({
      kind: 'invalid-json',
      packageName: 'server-error',
    }));
    await expect(fetchNpmDependencyMetadata('bad-shape')).resolves.toEqual(expect.objectContaining({
      kind: 'invalid-shape',
      packageName: 'bad-shape',
    }));
    await expect(fetchNpmDependencyMetadata('primitive-shape')).resolves.toEqual(expect.objectContaining({
      kind: 'invalid-shape',
      packageName: 'primitive-shape',
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

  it('handles buildDependencyHealthMetadata unknown status when version cannot be normalized', async () => {
    const fetchMock = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: 'invalid-latest' },
      license: 'MIT',
    }), { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    // Use empty string to force normalizeVersion to return undefined
    const meta = await fetchNpmDependencyMetadata('test-pkg-normalization', '');
    expect(meta).toEqual({
      status: 'unknown',
      latestVersion: 'invalid-latest',
      license: 'MIT',
      checkedAt: meta.checkedAt,
    });

    // Use undefined currentVersion to cover line 176
    const meta2 = await fetchNpmDependencyMetadata('test-pkg-normalization-undef', undefined);
    expect(meta2.status).toBe('unknown');
    expect(meta2.currentVersion).toBeUndefined();
  });

  it('handles workspace/file/link local dependencies directly without fetching', async () => {
    const meta = await fetchNpmDependencyMetadata('local-dep', 'workspace:*');
    expect(meta.status).toBe('current');
    expect(meta.latestVersion).toBe('workspace:*');
  });

  it('handles extractLicense returning undefined for invalid license structure', async () => {
    const fetchMock = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0' },
      license: { foo: 'bar' }, // invalid shape
    }), { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const meta = await fetchNpmDependencyMetadata('test-pkg-license', '1.0.0');
    expect(meta.license).toBeUndefined();
  });

  it('handles compareVersions numeric and mixed pre-release comparisons', async () => {
    // case lpIsNum && rpIsNum (alpha.1 vs alpha.2 -> outdated)
    const fetchMock1 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-alpha.2' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock1 as typeof fetch;
    const meta1 = await fetchNpmDependencyMetadata('test-pkg-pre1', '1.0.0-alpha.1');
    expect(meta1.status).toBe('outdated');

    // case lpIsNum && !rpIsNum (alpha.1 vs alpha.beta -> outdated since numbers are older/less than non-numbers)
    const fetchMock2 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-alpha.beta' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock2 as typeof fetch;
    const meta2 = await fetchNpmDependencyMetadata('test-pkg-pre2', '1.0.0-alpha.1');
    expect(meta2.status).toBe('outdated');

    // case lpIsNum && rpIsNum with diff === 0 (alpha.1 vs alpha.1 -> current)
    const fetchMock3 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-alpha.1' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock3 as typeof fetch;
    const meta3 = await fetchNpmDependencyMetadata('test-pkg-pre3', '1.0.0-alpha.1');
    expect(meta3.status).toBe('current');

    // case lp === undefined && rp !== undefined (alpha vs alpha.1 -> outdated)
    const fetchMock4 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-alpha.1' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock4 as typeof fetch;
    const meta4 = await fetchNpmDependencyMetadata('test-pkg-pre4', '1.0.0-alpha');
    expect(meta4.status).toBe('outdated');

    // case lp !== undefined && rp === undefined (alpha.1 vs alpha -> current)
    const fetchMock5 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-alpha' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock5 as typeof fetch;
    const meta5 = await fetchNpmDependencyMetadata('test-pkg-pre5', '1.0.0-alpha.1');
    expect(meta5.status).toBe('current');

    // case different release parts lengths (1 vs 1.0.1 -> outdated)
    const fetchMock6 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.1' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock6 as typeof fetch;
    const meta6 = await fetchNpmDependencyMetadata('test-pkg-pre6', '1');
    expect(meta6.status).toBe('outdated');

    // case different release parts lengths reverse (1.0.1 vs 1 -> current)
    const fetchMock8 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock8 as typeof fetch;
    const meta8 = await fetchNpmDependencyMetadata('test-pkg-pre8', '1.0.1');
    expect(meta8.status).toBe('current');

    // case non-numeric release part (abc vs 1.0.0 -> outdated since abc maps to 0.0.0)
    const fetchMock7 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock7 as typeof fetch;
    const meta7 = await fetchNpmDependencyMetadata('test-pkg-pre7', 'abc');
    expect(meta7.status).toBe('outdated');

    // case !lpIsNum && rpIsNum (alpha.beta vs alpha.1 -> current)
    const fetchMock9 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0-alpha.1' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock9 as typeof fetch;
    const meta9 = await fetchNpmDependencyMetadata('test-pkg-pre9', '1.0.0-alpha.beta');
    expect(meta9.status).toBe('current');
  });

  it('handles null registry payload and empty batch input', async () => {
    const fetchMock = mock(async () => new Response('null', { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const meta = await fetchNpmDependencyMetadata('test-pkg-null', '1.0.0');
    expect(meta).toEqual(expect.objectContaining({
      kind: 'invalid-shape',
    }));

    const batchRes = await fetchNpmDependencyMetadataBatch([]);
    expect(batchRes).toEqual({});

    const fetchMock2 = mock(async () => new Response(JSON.stringify({
      'dist-tags': { latest: '1.0.0' },
    }), { status: 200 }));
    globalThis.fetch = fetchMock2 as typeof fetch;

    const batchRes2 = await fetchNpmDependencyMetadataBatch([
      { ecosystem: 'npm', name: 'pkg-no-ver', type: 'prod' },
    ]);
    expect(batchRes2).toHaveProperty('npm:pkg-no-ver::prod');
  });
});
