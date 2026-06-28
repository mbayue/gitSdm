import { describe, expect, it, mock, spyOn, afterEach } from 'bun:test';
import { ApiError, fetchTrending } from './apiClient';

describe('apiClient request handling', () => {
  afterEach(() => {
    mock.restore();
  });

  it('handles successful API requests', async () => {
    const mockData = { repos: [{ name: 'test/repo', description: 'test' }] };
    spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await fetchTrending();
    expect(result).toEqual(mockData.repos as any);
  });

  it('throws ApiError on non-ok response', async () => {
    const errorData = { error: 'Not Found', code: '404' };
    spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(errorData), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    try {
      await fetchTrending();
      expect.unreachable('Should have thrown an ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not Found');
        expect(error.code).toBe('404');
      }
    }
  });

  it('throws "Network error or unexpected failure" on fetch exception', async () => {
    spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    try {
      await fetchTrending();
      expect.unreachable('Should have thrown an ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toBe('Network error or unexpected failure');
        expect(error.status).toBe(0);
      }
    }
  });

  it('preserves status 404 on text/plain error response', async () => {
    spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Not Found text', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    try {
      await fetchTrending();
      expect.unreachable('Should have thrown an ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not Found text');
      }
    }
  });

  it('preserves status 500 on HTML error response', async () => {
    spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('<html><body>Internal Server Error</body></html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    );

    try {
      await fetchTrending();
      expect.unreachable('Should have thrown an ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('<html><body>Internal Server Error</body></html>');
      }
    }
  });

  it('preserves JSON format on valid JSON error response', async () => {
    const errorData = { message: 'Custom Error Message', code: '400' };
    spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(errorData), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    try {
      await fetchTrending();
      expect.unreachable('Should have thrown an ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('Custom Error Message');
      }
    }
  });
});
