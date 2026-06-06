import { describe, expect, it } from 'bun:test';
import { getPublicAppConfig } from './app-config';

describe('getPublicAppConfig', () => {
  it('defaults AI provider to mock', () => {
    expect(getPublicAppConfig({}).aiProvider).toBe('mock');
  });

  it('normalizes AI provider casing', () => {
    expect(getPublicAppConfig({ AI_PROVIDER: 'OpenAI' }).aiProvider).toBe('openai');
  });

  it('handles empty process environment properties safely', () => {
    expect(getPublicAppConfig({ AI_PROVIDER: '' }).aiProvider).toBe('');
  });

  it('handles other potential AI providers', () => {
    expect(getPublicAppConfig({ AI_PROVIDER: 'gemini' }).aiProvider).toBe('gemini');
    expect(getPublicAppConfig({ AI_PROVIDER: 'ANTHROPIC' }).aiProvider).toBe('anthropic');
  });
});
