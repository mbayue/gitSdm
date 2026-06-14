import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { clearAllCaches } from '../cache/lru';
import { executeAiTask } from './service';

const completeMock = mock(async () => '{"value":"live"}');

mock.module('./provider', () => ({
  getAIProvider: mock(async () => ({
    complete: completeMock,
  })),
}));

describe('ai service', () => {
  beforeEach(() => {
    clearAllCaches();
    completeMock.mockClear();

    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.OPENAI_MODEL;
    delete process.env.ANTHROPIC_MODEL;
  });

  it('uses mock fallback without lru cache when provider is mock', async () => {
    process.env.AI_PROVIDER = 'mock';

    const first = await executeAiTask({
      taskName: 'summary',
      owner: 'o',
      repo: 'r',
      sha: 's',
      systemPrompt: 'system',
      userPrompt: 'user',
      json: true,
      mockFallback: () => ({ value: 'mock' }),
    });
    const second = await executeAiTask({
      taskName: 'summary',
      owner: 'o',
      repo: 'r',
      sha: 's',
      systemPrompt: 'system',
      userPrompt: 'user',
      json: true,
      mockFallback: () => ({ value: 'mock' }),
    });

    expect(first).toEqual({ data: { value: 'mock' }, cached: false });
    expect(second).toEqual({ data: { value: 'mock' }, cached: false });
    expect(completeMock).not.toHaveBeenCalled();
  });

  it('caches live AI API calls in lru-cache', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-env-key';

    const params = {
      taskName: 'summary',
      owner: 'o',
      repo: 'r',
      sha: 's',
      paramHash: 'params',
      systemPrompt: 'system',
      userPrompt: 'user',
      json: true,
      mockFallback: () => ({ value: 'mock' }),
    };

    const first = await executeAiTask(params);
    const second = await executeAiTask(params);

    expect(first).toEqual({ data: { value: 'live' }, cached: false });
    expect(second).toEqual({ data: { value: 'live' }, cached: true });
    expect(completeMock).toHaveBeenCalledTimes(1);
  });

  it('separates lru-cache entries by user api key', async () => {
    process.env.AI_PROVIDER = 'gemini';

    const baseParams = {
      taskName: 'summary',
      owner: 'o',
      repo: 'r',
      sha: 's',
      paramHash: 'params',
      systemPrompt: 'system',
      userPrompt: 'user',
      json: true,
      mockFallback: () => ({ value: 'mock' }),
    };

    const first = await executeAiTask({ ...baseParams, apiKey: 'gemini-user-a' });
    const second = await executeAiTask({ ...baseParams, apiKey: 'gemini-user-b' });
    const third = await executeAiTask({ ...baseParams, apiKey: 'gemini-user-a' });

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(false);
    expect(third.cached).toBe(true);
    expect(completeMock).toHaveBeenCalledTimes(2);
  });
});