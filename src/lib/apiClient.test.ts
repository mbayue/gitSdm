import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { fetchTrending, ApiError } from './apiClient';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock(() => Promise.resolve(new Response()));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchTrending', () => {
    it('fetches trending repos successfully', async () => {
      const mockRepos = [
        { author: 'test', name: 'repo1', stars: 100 },
        { author: 'test', name: 'repo2', stars: 200 }
      ];

      global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ repos: mockRepos }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })));

      const result = await fetchTrending();

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockRepos as any);
    });

    it('throws ApiError on failed request', async () => {
      global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })));

      await expect(fetchTrending()).rejects.toThrow(ApiError);
    });
  });
});
