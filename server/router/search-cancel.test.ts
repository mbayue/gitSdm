import { test, expect, spyOn } from 'bun:test';
import { Octokit } from '@octokit/rest';
import { handleSearchRoutes } from './search-routes';
import { getIndexingPipeline } from '../search/indexing-pipeline';
import { AppError } from '../utils/errors';

test('Cancel still reaches a paused build after Resume is rejected as busy', async () => {
  const pipeline = getIndexingPipeline();
  const status = spyOn(pipeline, 'getStatus').mockReturnValue({ state: 'paused', progress: 0 });
  const start = spyOn(pipeline, 'startIndexing').mockRejectedValue(new AppError(429, 'Busy', 'INDEXING_BUSY', true));
  const cancel = spyOn(pipeline, 'cancelIndexing').mockImplementation(() => {});
  try {
    const ctx = {
      gitHubToken: crypto.randomUUID(),
      octokit: new Octokit({
        request: {
          fetch: async (input: string | URL | Request) =>
            String(input).includes('/commits/')
              ? Response.json({ sha: 'paused-snapshot' })
              : Response.json({ default_branch: 'main', full_name: 'review/busy', topics: [] }),
        },
      }),
    };
    const body = { owner: 'review', repo: 'busy', buildId: crypto.randomUUID() };
    const call = (path: string) =>
      handleSearchRoutes(
        path,
        new Request('http://localhost' + path, { method: 'POST', body: JSON.stringify(body) }),
        {},
        undefined,
        ctx,
        Date.now(),
      );
    await expect(call('/api/search/index')).rejects.toMatchObject({ code: 'INDEXING_BUSY' });
    await call('/api/search/cancel');
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    status.mockRestore();
    start.mockRestore();
    cancel.mockRestore();
  }
});

test('Cancel prevents a metadata-delayed build from starting, with and without a build ID', async () => {
  const previous = process.env.EMBEDDING_PROVIDER;
  process.env.EMBEDDING_PROVIDER = 'mock';
  try {
    for (const buildId of [crypto.randomUUID(), undefined]) {
      let release!: () => void;
      let entered!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const waiting = new Promise<void>((resolve) => {
        entered = resolve;
      });
      let metadata = 0;
      let trees = 0;
      const octokit = new Octokit({
        request: {
          fetch: async (input: string | URL | Request) => {
            const url = String(input);
            if (url.endsWith('/repos/review/cancel-order')) {
              if (++metadata === 1) {
                entered();
                await gate;
              }
              return Response.json({ default_branch: 'main', full_name: 'review/cancel-order', topics: [] });
            }
            if (url.includes('/commits/')) return Response.json({ sha: 'snapshot' });
            if (url.includes('/git/trees/')) {
              trees++;
              return Response.json({ tree: [], truncated: false });
            }
            throw new Error('Unexpected mocked request');
          },
        },
      });
      const ctx = { octokit, gitHubToken: crypto.randomUUID() };
      const call = (path: string) =>
        handleSearchRoutes(
          path,
          new Request('http://localhost' + path, {
            method: 'POST',
            body: JSON.stringify({ owner: 'review', repo: 'cancel-order', buildId }),
          }),
          {},
          undefined,
          ctx,
          Date.now(),
        );
      const start = call('/api/search/index');
      await waiting;
      expect(await (await call('/api/search/cancel'))?.json()).toMatchObject({ state: 'idle' });
      release();
      expect(await (await start)?.json()).toMatchObject({ state: 'idle' });
      expect(trees).toBe(0);
      if (!buildId) {
        expect(await (await call('/api/search/index'))?.json()).toMatchObject({ state: 'complete' });
        expect(trees).toBe(1);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.EMBEDDING_PROVIDER;
    else process.env.EMBEDDING_PROVIDER = previous;
  }
});

test('a Cancel arriving before Start is remembered without GitHub requests', async () => {
  const ctx = {
    octokit: new Octokit({
      request: {
        fetch: async () => {
          throw new Error('No GitHub work expected');
        },
      },
    }),
    gitHubToken: 'review-before-start',
  };
  const body = { owner: 'review', repo: 'cancel-order', buildId: crypto.randomUUID() };
  for (const path of ['/api/search/cancel', '/api/search/index']) {
    const response = await handleSearchRoutes(
      path,
      new Request('http://localhost' + path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
      {},
      undefined,
      ctx,
      Date.now(),
    );
    expect(await response?.json()).toMatchObject({ state: 'idle' });
  }
});
