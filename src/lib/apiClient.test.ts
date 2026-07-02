import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import {
  aiExplain,
  aiExplainLif,
  aiHealth,
  aiLearningPath,
  aiMermaid,
  aiReadmeEnhance,
  aiRefactor,
  aiRoast,
  analyzeRepo,
  ApiError,
  fetchAppConfig,
  fetchIndexingStatus,
  fetchRepoBranches,
  fetchRepoFile,
  fetchTrending,
  semanticAsk,
  semanticSearch,
  triggerIndexing,
} from './apiClient';

describe('apiClient', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mock.restore();
  });

  describe('request handling', () => {
    it('throws ApiError on non-ok response', async () => {
      spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Not Found', code: '404' }), { status: 404 }));

      let error: unknown;
      try {
        await fetchTrending();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not Found');
        expect(error.code).toBe('404');
      }
    });

    it('throws "Network error or unexpected failure" on fetch exception', async () => {
      spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

      let error: unknown;
      try {
        await fetchTrending();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toBe('Network error or unexpected failure');
        expect(error.status).toBe(0);
      }
    });

    it('preserves status 404 on text/plain error response', async () => {
      spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Not Found text', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      }));

      let error: unknown;
      try {
        await fetchTrending();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not Found text');
      }
    });

    it('preserves status 500 on HTML error response', async () => {
      spyOn(global, 'fetch').mockResolvedValueOnce(new Response('<html><body>Internal Server Error</body></html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }));

      let error: unknown;
      try {
        await fetchTrending();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('<html><body>Internal Server Error</body></html>');
      }
    });

    it('uses message on valid JSON error response', async () => {
      spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Custom Error Message', code: '400' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }));

      let error: unknown;
      try {
        await fetchTrending();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('Custom Error Message');
        expect(error.code).toBe('400');
      }
    });

    it('preserves HTTP status for invalid JSON error response', async () => {
      spyOn(global, 'fetch').mockResolvedValueOnce(new Response('{ nope', {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }));

      let error: unknown;
      try {
        await fetchTrending();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(502);
        expect(error.message).toBe('Invalid JSON response');
      }
    });
  });

  describe('fetchRepoBranches', () => {
    it('fetches repository branches successfully', async () => {
      const mockBranches = [{ name: 'main', protected: true }, { name: 'dev', protected: false }];
      const fetchMock = mock(async () => new Response(JSON.stringify(mockBranches), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await fetchRepoBranches('facebook', 'react');

      const url = new URL(fetchMock.mock.calls[0][0].toString(), 'http://localhost');
      expect(url.pathname).toBe('/api/repo/branches');
      expect(url.searchParams.get('owner')).toBe('facebook');
      expect(url.searchParams.get('repo')).toBe('react');
      expect(result).toEqual(mockBranches);
    });

    it('throws ApiError when request fails', async () => {
      global.fetch = mock(async () => new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })) as any;

      await expect(fetchRepoBranches('facebook', 'nonexistent')).rejects.toThrow(ApiError);
    });
  });

  describe('fetchTrending', () => {
    it('fetches trending repos successfully', async () => {
      const mockRepos = [{ author: 'test', name: 'repo1', stars: 100 }, { author: 'test', name: 'repo2', stars: 200 }];
      const fetchMock = mock(async () => new Response(JSON.stringify({ repos: mockRepos }), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await fetchTrending();

      expect(fetchMock).toHaveBeenCalledWith('/api/trending', expect.any(Object));
      expect(result).toEqual(mockRepos as any);
    });

    it('throws ApiError on failed request', async () => {
      global.fetch = mock(async () => new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })) as any;

      await expect(fetchTrending()).rejects.toThrow(ApiError);
    });
  });

  describe('fetchRepoFile', () => {
    it('appends owner, repo, and path to query params', async () => {
      const mockData = { path: 'src/index.js', content: 'console.log("hello")', sha: 'abc' };
      const fetchMock = mock(async () => new Response(JSON.stringify(mockData), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await fetchRepoFile('testOwner', 'testRepo', 'src/index.js');

      const url = fetchMock.mock.calls[0][0].toString();
      expect(url).toContain('/api/repo/file');
      expect(url).toContain('owner=testOwner');
      expect(url).toContain('repo=testRepo');
      expect(url).toContain('path=src%2Findex.js');
      expect(url).not.toContain('branch=');
      expect(result).toEqual(mockData);
    });

    it('appends branch to query params if provided', async () => {
      const mockData = { path: 'src/index.js', content: 'console.log("hello")', sha: 'abc' };
      const fetchMock = mock(async () => new Response(JSON.stringify(mockData), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await fetchRepoFile('testOwner', 'testRepo', 'src/index.js', 'main-branch');

      const url = fetchMock.mock.calls[0][0].toString();
      expect(url).toContain('/api/repo/file');
      expect(url).toContain('owner=testOwner');
      expect(url).toContain('repo=testRepo');
      expect(url).toContain('path=src%2Findex.js');
      expect(url).toContain('branch=main-branch');
      expect(result).toEqual(mockData);
    });
  });

  describe('analyzeRepo', () => {
    it('makes a POST request to /api/repo/analyze and returns data', async () => {
      const mockData = { name: 'test-repo', summary: 'test' };
      const fetchMock = mock(async () => new Response(JSON.stringify(mockData), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await analyzeRepo('https://github.com/foo/bar', 'main');

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/repo/analyze');
      expect(options?.method).toBe('POST');
      expect(JSON.parse(options?.body as string)).toEqual({ url: 'https://github.com/foo/bar', branch: 'main' });
      expect(result).toEqual(mockData as any);
    });

    it('throws an ApiError on failed request', async () => {
      global.fetch = mock(async () => new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })) as any;

      await expect(analyzeRepo('https://github.com/foo/bar', 'main')).rejects.toThrow(ApiError);
    });
  });

  describe('semanticSearch', () => {
    it('makes a POST request with correct payload', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ results: [] }), { status: 200 }));
      global.fetch = mockFetch as any;

      const response = await semanticSearch('test query', 'facebook', 'react');

      expect(mockFetch.mock.calls[0][0]).toBe('/api/search');
      expect(mockFetch.mock.calls[0][1]?.method).toBe('POST');
      expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify({ query: 'test query', owner: 'facebook', repo: 'react' }));
      expect(response).toEqual({ results: [] });
    });

    it('includes branch in the payload when provided', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ results: [] }), { status: 200 }));
      global.fetch = mockFetch as any;

      await semanticSearch('test query', 'facebook', 'react', 'main');

      expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify({ query: 'test query', owner: 'facebook', repo: 'react', branch: 'main' }));
    });

    it('throws ApiError on failed request', async () => {
      global.fetch = mock(async () => new Response(JSON.stringify({ error: 'Search failed' }), { status: 500 })) as any;

      await expect(semanticSearch('test query', 'facebook', 'react')).rejects.toThrow(ApiError);
    });
  });

  describe('aiExplain', () => {
    it('successfully calls /api/ai/explain and returns data', async () => {
      const mockResponse = { explanation: 'This is a test explanation.' };
      const fetchMock = mock(async () => new Response(JSON.stringify(mockResponse), { status: 200 }));
      globalThis.fetch = fetchMock as any;
      const requestBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'src/index.ts',
        content: 'console.log("hello");',
        branch: 'main',
      };

      const result = await aiExplain(requestBody);

      expect(result).toEqual(mockResponse as any);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/explain');
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(requestBody));
    });

    it('throws ApiError on failed request', async () => {
      globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: 'Failed to explain' }), { status: 400 })) as any;

      await expect(aiExplain({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'src/index.ts',
        content: 'console.log("hello");',
      })).rejects.toThrow(ApiError);
    });
  });

  describe('thin wrappers', () => {
    it('fetches app config', async () => {
      const fetchMock = mock(async () => new Response(JSON.stringify({ aiProvider: 'mock' }), { status: 200 }));
      global.fetch = fetchMock as any;

      await expect(fetchAppConfig()).resolves.toEqual({ aiProvider: 'mock' });
      expect(fetchMock.mock.calls[0][0]).toBe('/api/config');
    });

    it.each([
      [aiExplainLif, '/api/ai/explain-lif'],
      [aiRefactor, '/api/ai/refactor'],
      [aiHealth, '/api/ai/health'],
      [aiMermaid, '/api/ai/mermaid'],
      [aiRoast, '/api/ai/roast'],
      [aiReadmeEnhance, '/api/ai/readme-enhance'],
      [aiLearningPath, '/api/ai/learning-path'],
    ] as const)('POSTs owner, repo, and branch to %s', async (fn, path) => {
      const fetchMock = mock(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
      global.fetch = fetchMock as any;

      await fn('owner', 'repo', 'branch');

      expect(fetchMock.mock.calls[0][0]).toBe(path);
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ owner: 'owner', repo: 'repo', branch: 'branch' }));
    });

    it('asks semantic question', async () => {
      const fetchMock = mock(async () => new Response(JSON.stringify({ answer: '42', citations: [], cached: false }), { status: 200 }));
      global.fetch = fetchMock as any;

      await semanticAsk('why?', 'owner', 'repo', 'branch');

      expect(fetchMock.mock.calls[0][0]).toBe('/api/search/ask');
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ question: 'why?', owner: 'owner', repo: 'repo', branch: 'branch' }));
    });

    it('triggers indexing', async () => {
      const fetchMock = mock(async () => new Response(JSON.stringify({ status: 'queued' }), { status: 200 }));
      global.fetch = fetchMock as any;

      await expect(triggerIndexing('owner', 'repo', 'branch')).resolves.toEqual({ status: 'queued' });
      expect(fetchMock.mock.calls[0][0]).toBe('/api/search/index');
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ owner: 'owner', repo: 'repo', branch: 'branch' }));
    });

    it('fetches indexing status', async () => {
      const fetchMock = mock(async () => new Response(JSON.stringify({ state: 'idle' }), { status: 200 }));
      global.fetch = fetchMock as any;

      await expect(fetchIndexingStatus('owner', 'repo')).resolves.toEqual({ state: 'idle' });
      expect(fetchMock.mock.calls[0][0]).toBe('/api/search/status?owner=owner&repo=repo');
    });
  });
});