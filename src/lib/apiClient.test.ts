import { describe, expect, it, mock, afterEach, beforeEach } from 'bun:test';
import { semanticSearch, ApiError } from './apiClient';

describe('apiClient', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mock.restore();
  });

  describe('semanticSearch', () => {
    it('makes a POST request with correct payload', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      global.fetch = mockFetch as any;

      const response = await semanticSearch('test query', 'facebook', 'react');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('/api/search');

      const options = call[1];
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ query: 'test query', owner: 'facebook', repo: 'react' }));
      expect(response).toEqual({ results: [] });
    });

    it('includes branch in the payload when provided', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      global.fetch = mockFetch as any;

      await semanticSearch('test query', 'facebook', 'react', 'main');

      const call = mockFetch.mock.calls[0];
      const options = call[1];
      expect(options.body).toBe(JSON.stringify({ query: 'test query', owner: 'facebook', repo: 'react', branch: 'main' }));
    });

    it('throws ApiError on failed request', async () => {
      const mockFetch = mock(async () => new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
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
});
