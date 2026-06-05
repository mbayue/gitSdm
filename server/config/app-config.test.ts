import { describe, expect, it } from 'vitest';
import { getPublicAppConfig } from './app-config';

describe('getPublicAppConfig', () => {
  it('defaults AI provider to mock', () => {
    expect(getPublicAppConfig({}).aiProvider).toBe('mock');
  });

  it('normalizes AI provider casing', () => {
    expect(getPublicAppConfig({ AI_PROVIDER: 'OpenAI' }).aiProvider).toBe('openai');
  });
});
