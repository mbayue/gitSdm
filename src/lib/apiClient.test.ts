import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { analyzeRepo, ApiError } from './apiClient';

describe('apiClient - analyzeRepo', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('makes a POST request to /api/repo/analyze and returns data', async () => {
    const mockData = { name: 'test-repo', summary: 'test' };
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const result = await analyzeRepo('https://github.com/foo/bar', 'main');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('/api/repo/analyze');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ url: 'https://github.com/foo/bar', branch: 'main' });
    expect(result).toEqual(mockData as any);
  });

  it('throws an ApiError on failed request', async () => {
    const errorData = { error: 'Internal Server Error' };
    (global.fetch as ReturnType<typeof mock>).mockResolvedValue(new Response(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }));

    let error;
    try {
      await analyzeRepo('https://github.com/foo/bar', 'main');
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe('Internal Server Error');
  });
});
