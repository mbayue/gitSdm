import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { aiArchitecture, aiExplain, analyzeRepo, ApiError, fetchRepoFile, semanticSearch } from './apiClient';

describe('apiClient', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mock.restore();
  });

  describe('fetchRepoFile', () => {
    it('appends owner, repo, and path to query params', async () => {
      const mockData = { path: 'src/index.js', content: 'console.log("hello")', sha: 'abc' };
      const fetchMock = mock(async () => new Response(JSON.stringify(mockData), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await fetchRepoFile('testOwner', 'testRepo', 'src/index.js');

      expect(fetchMock).toHaveBeenCalledTimes(1);
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

      expect(fetchMock).toHaveBeenCalledTimes(1);
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
      const fetchMock = mock(async () => new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
      global.fetch = fetchMock as any;

      const result = await analyzeRepo('https://github.com/foo/bar', 'main');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/repo/analyze');
      expect(options?.method).toBe('POST');
      expect(JSON.parse(options?.body as string)).toEqual({ url: 'https://github.com/foo/bar', branch: 'main' });
      expect(result).toEqual(mockData as any);
    });

    it('throws an ApiError on failed request', async () => {
      const errorData = { error: 'Internal Server Error' };
      const fetchMock = mock(async () => new Response(JSON.stringify(errorData), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
      global.fetch = fetchMock as any;

      let error: unknown;
      try {
        await analyzeRepo('https://github.com/foo/bar', 'main');
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('Internal Server Error');
      }
    });
  });

  describe('aiArchitecture', () => {
    it('forms the correct request payload and parses the response', async () => {
      const mockResponse = { architecture: 'some-arch' };
      const fetchMock = mock(async () => new Response(JSON.stringify(mockResponse), { status: 200 }));
      global.fetch = fetchMock as any;

      const result = await aiArchitecture('test-owner', 'test-repo', 'main');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const fetchCall = fetchMock.mock.calls[0];
      expect(fetchCall[0]).toBe('/api/ai/architecture');
      expect(fetchCall[1]?.method).toBe('POST');
      expect(fetchCall[1]?.body).toBe(JSON.stringify({ owner: 'test-owner', repo: 'test-repo', branch: 'main' }));
      expect(fetchCall[1]?.headers).toMatchObject({
        'Content-Type': 'application/json',
      });
      expect(result).toEqual(mockResponse as any);
    });

    it('handles missing branch parameter', async () => {
      const fetchMock = mock(async () => new Response(JSON.stringify({ architecture: 'some-arch' }), { status: 200 }));
      global.fetch = fetchMock as any;

      await aiArchitecture('test-owner', 'test-repo');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const fetchCall = fetchMock.mock.calls[0];
      expect(fetchCall[1]?.body).toBe(JSON.stringify({ owner: 'test-owner', repo: 'test-repo' }));
    });

    it('throws ApiError if the response is not ok', async () => {
      const errorResponse = { error: 'Internal Server Error', code: '500' };
      global.fetch = mock(async () => new Response(JSON.stringify(errorResponse), { status: 500 })) as any;

      let caughtError: unknown;
      try {
        await aiArchitecture('test-owner', 'test-repo', 'main');
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ApiError);
      if (caughtError instanceof ApiError) {
        expect(caughtError.status).toBe(500);
        expect(caughtError.message).toBe('Internal Server Error');
        expect(caughtError.code).toBe('500');
      }
    });
  });

  describe('semanticSearch', () => {
    it('makes a POST request with correct payload', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
      global.fetch = mockFetch as any;

      const response = await semanticSearch('test query', 'facebook', 'react');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('/api/search');

      const options = call[1];
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify({ query: 'test query', owner: 'facebook', repo: 'react' }));
      expect(response).toEqual({ results: [] });
    });

    it('includes branch in the payload when provided', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
      global.fetch = mockFetch as any;

      await semanticSearch('test query', 'facebook', 'react', 'main');

      const call = mockFetch.mock.calls[0];
      const options = call[1];
      expect(options?.body).toBe(JSON.stringify({ query: 'test query', owner: 'facebook', repo: 'react', branch: 'main' }));
    });

    it('throws ApiError on failed request', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
      global.fetch = mockFetch as any;

      let caughtError: unknown;
      try {
        await semanticSearch('test query', 'facebook', 'react');
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ApiError);
      if (caughtError instanceof ApiError) {
        expect(caughtError.status).toBe(500);
        expect(caughtError.message).toBe('Search failed');
      }
    });
  });

  describe('aiExplain', () => {
    it('successfully calls /api/ai/explain and returns data', async () => {
      const mockResponse = { explanation: 'This is a test explanation.' };

      const fetchMock = mock(async () => new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
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
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toBe('/api/ai/explain');
      expect(callArgs[1]?.method).toBe('POST');
      expect(callArgs[1]?.body).toBe(JSON.stringify(requestBody));
    });

    it('throws ApiError on failed request', async () => {
      const errorResponse = { error: 'Failed to explain' };

      const fetchMock = mock(async () => new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }));
      globalThis.fetch = fetchMock as any;

      const requestBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'src/index.ts',
        content: 'console.log("hello");',
      };

      let thrownError: any;
      try {
        await aiExplain(requestBody);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(400);
      expect(thrownError.error).toBe('Failed to explain');
    });
  });
});