import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { fetchRepoFile } from './apiClient.ts';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchRepoFile', () => {
    it('appends owner, repo, and path to query params', async () => {
      const mockData = { path: 'src/index.js', content: 'console.log("hello")', sha: 'abc' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchRepoFile('testOwner', 'testRepo', 'src/index.js');

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const calls = (global.fetch as any).mock.calls;
      const url = calls[0][0];

      expect(url.toString()).toContain('/api/repo/file');
      expect(url.toString()).toContain('owner=testOwner');
      expect(url.toString()).toContain('repo=testRepo');
      expect(url.toString()).toContain('path=src%2Findex.js');
      expect(url.toString()).not.toContain('branch=');

      expect(result).toEqual(mockData);
    });

    it('appends branch to query params if provided', async () => {
      const mockData = { path: 'src/index.js', content: 'console.log("hello")', sha: 'abc' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchRepoFile('testOwner', 'testRepo', 'src/index.js', 'main-branch');

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const calls = (global.fetch as any).mock.calls;
      const url = calls[0][0];

      expect(url.toString()).toContain('/api/repo/file');
      expect(url.toString()).toContain('owner=testOwner');
      expect(url.toString()).toContain('repo=testRepo');
      expect(url.toString()).toContain('path=src%2Findex.js');
      expect(url.toString()).toContain('branch=main-branch');

      expect(result).toEqual(mockData);
    });
  });
});
