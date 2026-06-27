import { describe, expect, it, spyOn } from 'bun:test';
import { logApi, logError } from './logger';

describe('utils/logger', () => {
  it('logs API request metadata to console.log', () => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});

    logApi('/api/test', { user: 'bayue', success: true });

    expect(logSpy).toHaveBeenCalled();
    const arg = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe('info');
    expect(parsed.route).toBe('/api/test');
    expect(parsed.user).toBe('bayue');
    expect(parsed.success).toBe(true);
    expect(parsed.timestamp).toBeDefined();

    logSpy.mockRestore();
  });

  it('logs errors to console.error', () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    const testError = new Error('Database connection failed');
    logError('/api/db', testError, { retryCount: 3 });

    expect(errorSpy).toHaveBeenCalled();
    const arg = errorSpy.mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe('error');
    expect(parsed.route).toBe('/api/db');
    expect(parsed.error).toBe('Database connection failed');
    expect(parsed.stack).toContain('Error: Database connection failed');
    expect(parsed.retryCount).toBe(3);
    expect(parsed.timestamp).toBeDefined();

    errorSpy.mockRestore();
  });

  it('logs string/unknown errors to console.error', () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    logError('/api/unknown', 'something went wrong');

    expect(errorSpy).toHaveBeenCalled();
    const arg = errorSpy.mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe('error');
    expect(parsed.route).toBe('/api/unknown');
    expect(parsed.error).toBe('something went wrong');
    expect(parsed.stack).toBeUndefined();

    errorSpy.mockRestore();
  });

  it('logs errors to console.error without stack in production', () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'production';

      const testError = new Error('Database connection failed');
      logError('/api/db', testError, { retryCount: 3 });

      expect(errorSpy).toHaveBeenCalled();
      const arg = errorSpy.mock.calls[0][0];
      const parsed = JSON.parse(arg);
      expect(parsed.level).toBe('error');
      expect(parsed.route).toBe('/api/db');
      expect(parsed.error).toBe('Database connection failed');
      expect(parsed.stack).toBeUndefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
      errorSpy.mockRestore();
    }
  });
});
