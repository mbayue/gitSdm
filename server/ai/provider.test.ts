import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createProvider, getAIProvider } from './provider';

mock.module('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mock(async () => ({ text: '{"ok":"gemini"}' })),
    };

    constructor(_config: { apiKey: string; apiVersion?: string }) {}
  },
}));

mock.module('openai', () => {
  class OpenAI {
    baseURL = '';
    chat = {
      completions: {
        create: mock(async () => ({ choices: [{ message: { content: '{"ok":"openai"}' } }] })),
      },
    };

    constructor(_config: { apiKey: string }) {}
  }

  return { default: OpenAI };
});

mock.module('@anthropic-ai/sdk', () => {
  class Anthropic {
    baseURL = '';
    messages = {
      create: mock(async () => ({ content: [{ type: 'text', text: 'anthropic-ok' }] })),
    };

    constructor(_config: { apiKey: string }) {}
  }

  return { default: Anthropic };
});

describe('ai provider', () => {
  beforeEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.OPENAI_MODEL;
    delete process.env.ANTHROPIC_MODEL;
  });

  it('auto-detects mock provider and covers canned responses', async () => {
    const provider = await createProvider();

    expect(await provider.complete([{ role: 'user', content: 'architecture' }])).toContain('overview');
    expect(await provider.complete([{ role: 'user', content: 'suggest' }])).toContain('README.md');
    expect(await provider.complete([{ role: 'user', content: 'onboarding' }])).toContain('steps');
    expect(await provider.complete([{ role: 'user', content: 'ELI5 completely new' }])).toContain('Welcome');
    expect(await provider.complete([{ role: 'user', content: 'refactoring improvements' }])).toContain('suggestions');
    expect(await provider.complete([{ role: 'user', content: 'scores (0 to 100)' }])).toContain('maintainability');
    expect(await provider.complete([{ role: 'user', content: 'Mermaid.js flowchart' }])).toContain('mermaid');
    expect(await provider.complete([{ role: 'user', content: 'developer "roast"' }])).toContain('Roast');
    expect(await provider.complete([{ role: 'user', content: 'enhanced, professional, and visually stunning README.md' }])).toContain('gitSdm');
    expect(await provider.complete([{ role: 'user', content: 'other text' }])).toContain('mock AI explanation');
  });

  it('uses env key auto-detection and provider clients', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key';
    process.env.GEMINI_MODEL = 'gemini-custom';
    process.env.GEMINI_API_VERSION = 'v1';
    let provider = await createProvider();
    expect(await provider.complete([
      { role: 'system', content: 'sys' },
      { role: 'assistant', content: 'prev' },
      { role: 'user', content: 'now' },
    ], { json: true })).toContain('gemini');

    delete process.env.GEMINI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-env';
    process.env.OPENAI_API_BASE = 'https://openai.test';
    process.env.OPENAI_MODEL = 'gpt-test';
    provider = await createProvider();
    expect(await provider.complete([{ role: 'user', content: 'now' }], { json: true })).toContain('openai');

    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env';
    process.env.ANTHROPIC_API_BASE = 'https://anthropic.test';
    process.env.ANTHROPIC_MODEL = 'claude-test';
    provider = await createProvider();
    expect(await provider.complete([
      { role: 'system', content: 'sys' },
      { role: 'assistant', content: 'prev' },
      { role: 'user', content: 'now' },
    ])).toBe('anthropic-ok');
  });

  it('uses override key detection and validates missing env keys', async () => {
    expect(await (await createProvider('sk-openai')).complete([{ role: 'user', content: 'x' }])).toContain('openai');
    expect(await (await createProvider('sk-ant-anthropic')).complete([{ role: 'user', content: 'x' }])).toBe('anthropic-ok');
    expect(await (await createProvider('gemini-override')).complete([{ role: 'user', content: 'x' }])).toContain('gemini');

    process.env.AI_PROVIDER = 'gemini';
    await expect(createProvider()).rejects.toThrow('GEMINI_API_KEY');

    process.env.AI_PROVIDER = 'openai';
    await expect(createProvider()).rejects.toThrow('OPENAI_API_KEY');

    process.env.AI_PROVIDER = 'anthropic';
    await expect(createProvider()).rejects.toThrow('ANTHROPIC_API_KEY');

    // Cover empty/whitespace override key falling through to env detection
    delete process.env.AI_PROVIDER;
    const mockProvider = await createProvider('   ');
    expect(await mockProvider.complete([{ role: 'user', content: 'x' }])).toContain('mock AI explanation');
  });

  it('uses mock from explicit env and caches getAIProvider', async () => {
    process.env.AI_PROVIDER = 'mock';
    const a = await getAIProvider();
    const b = await getAIProvider();
    expect(a).toBe(b);
  });

  it('creates fresh provider for override keys', async () => {
    const a = await getAIProvider('gemini-key');
    const b = await getAIProvider('gemini-key');
    expect(a).not.toBe(b);
  });
});