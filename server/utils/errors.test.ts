import { describe, expect, it } from 'bun:test';
import { AppError, isAppError, toErrorPayload } from './errors';

describe('utils/errors', () => {
  it('creates AppError and detects it', () => {
    const error = new AppError(418, 'teapot', 'TEAPOT', true, { id: 1 });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.status).toBe(418);
    expect(error.message).toBe('teapot');
    expect(error.code).toBe('TEAPOT');
    expect(error.retryable).toBe(true);
    expect(error.context).toEqual({ id: 1 });
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error('x'))).toBe(false);
  });

  it('serializes AppError payload', () => {
    const error = new AppError(400, 'bad', 'BAD', false, { field: 'x' });

    expect(toErrorPayload(error)).toEqual({
      error: 'bad',
      code: 'BAD',
      status: 400,
      retryable: false,
      context: { field: 'x' },
    });
  });

  it('maps rate-limit errors', () => {
    expect(toErrorPayload(new Error('429 rate limit'))).toEqual({
      error: 'API rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      retryable: true,
    });
  });

  it('maps private/not-found/404 errors', () => {
    expect(toErrorPayload(new Error('private repo'))).toMatchObject({
      error: 'Repository not found or is private',
      code: 'REPO_INACCESSIBLE',
      status: 404,
      retryable: false,
    });
    expect(toErrorPayload(new Error('not found'))).toMatchObject({
      error: 'Repository not found or is private',
      code: 'REPO_INACCESSIBLE',
      status: 404,
    });
    expect(toErrorPayload(new Error('404'))).toMatchObject({
      error: 'Repository not found or is private',
      code: 'REPO_INACCESSIBLE',
      status: 404,
    });
  });

  it('maps generic, timeout, network, and non-error payloads', () => {
    expect(toErrorPayload(new Error('timeout'))).toMatchObject({
      error: 'Network connection failed',
      code: 'INTERNAL_ERROR',
      status: 500,
      retryable: true,
    });
    expect(toErrorPayload(new Error('network failed'))).toMatchObject({
      error: 'Network connection failed',
      code: 'INTERNAL_ERROR',
      status: 500,
      retryable: true,
    });
    expect(toErrorPayload('x')).toEqual({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      status: 500,
      retryable: false,
    });
  });
});