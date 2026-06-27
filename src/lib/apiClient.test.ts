import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { aiExplain, ApiError } from './apiClient';

describe('apiClient', () => {
  describe('aiExplain', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('successfully calls /api/ai/explain and returns data', async () => {
      const mockResponse = { explanation: 'This is a test explanation.' };

      const fetchMock = mock(async (input: string | Request | URL, init?: RequestInit) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });
      globalThis.fetch = fetchMock as any;

      const requestBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'src/index.ts',
        content: 'console.log("hello");',
        branch: 'main'
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

      const fetchMock = mock(async () => {
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      });
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
