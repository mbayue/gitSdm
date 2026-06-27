import { describe, expect, it, mock, afterEach, beforeEach } from 'bun:test';

// We cannot directly mock `request` inside `apiClient.ts` because it's an unexported
// internal function. However, the user task specifies we should test `fetchRepoBranches`.
// The user task mentions:
// Current Code:
// export async function fetchRepoBranches(
//   owner: string,
//   repo: string,
// ): Promise<string[]> {
//   return request<string[]>(`/api/github/branches?owner=${owner}&repo=${repo}`);
// }
//
// But the actual code in apiClient.ts is:
// export async function fetchRepoBranches(
//   owner: string,
//   repo: string,
// ): Promise<{ name: string; protected: boolean }[]> {
//   const params = new URLSearchParams({ owner, repo });
//   return request<{ name: string; protected: boolean }[]>(`/api/repo/branches?${params}`);
// }

import { fetchRepoBranches, ApiError } from './apiClient';

describe('apiClient', () => {
  describe('fetchRepoBranches', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should fetch repository branches successfully', async () => {
      const mockBranches = [
        { name: 'main', protected: true },
        { name: 'dev', protected: false },
      ];

      global.fetch = mock().mockResolvedValue(
        new Response(JSON.stringify(mockBranches), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await fetchRepoBranches('facebook', 'react');

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const url = new URL((global.fetch as any).mock.calls[0][0], 'http://localhost');

      expect(url.pathname).toBe('/api/repo/branches');
      expect(url.searchParams.get('owner')).toBe('facebook');
      expect(url.searchParams.get('repo')).toBe('react');

      expect(result).toEqual(mockBranches);
    });

    it('should throw an ApiError when the request fails', async () => {
      const errorData = { error: 'Not found' };

      global.fetch = mock().mockResolvedValue(
        new Response(JSON.stringify(errorData), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        await fetchRepoBranches('facebook', 'nonexistent');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toBe('Not found');
        }
      }
    });
  });
});
