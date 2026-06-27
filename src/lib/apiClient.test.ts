import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { aiArchitecture, ApiError } from './apiClient';

describe('apiClient', () => {
  describe('aiArchitecture', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should form the correct request payload and parse the response', async () => {
      const mockResponse = { architecture: 'some-arch' };
      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      );

      const result = await aiArchitecture('test-owner', 'test-repo', 'main');

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      expect(fetchCall[0]).toBe('/api/ai/architecture');
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].body).toBe(JSON.stringify({ owner: 'test-owner', repo: 'test-repo', branch: 'main' }));
      expect(fetchCall[1].headers).toMatchObject({
        'Content-Type': 'application/json',
      });

      expect(result).toEqual(mockResponse as any);
    });

    it('should handle missing branch parameter', async () => {
      const mockResponse = { architecture: 'some-arch' };
      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      );

      await aiArchitecture('test-owner', 'test-repo');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      expect(fetchCall[1].body).toBe(JSON.stringify({ owner: 'test-owner', repo: 'test-repo' }));
    });

    it('should throw an ApiError if the response is not ok', async () => {
      const errorResponse = { error: 'Internal Server Error', code: '500' };
      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 500 }))
      );

      try {
        await aiArchitecture('test-owner', 'test-repo', 'main');
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiError = err as ApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.message).toBe('Internal Server Error');
        expect(apiError.code).toBe('500');
      }
    });
  });
});
