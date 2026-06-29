import { getAIProvider } from './provider';
import { aiCacheKey, cache, hashToken } from '../cache/lru';
import { logApi } from '../utils/logger';

// Concurrency queue to control/batch AI API requests
class PromiseQueue {
  private queue: (() => Promise<void>)[] = [];
  private activeCount = 0;
  constructor(private maxConcurrency = 2) { }

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.next();
    });
  }

  private next() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }
    this.activeCount++;
    const fn = this.queue.shift()!;
    fn().finally(() => {
      this.activeCount--;
      this.next();
    });
  }
}

const aiQueue = new PromiseQueue(2);

function getAiCacheDiscriminator(apiKey?: string): string {
  const envProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const provider = apiKey?.trim()
    ? (apiKey.trim().startsWith('sk-ant-') ? 'anthropic' : apiKey.trim().startsWith('sk-') ? 'openai' : 'gemini')
    : (envProvider && envProvider.length > 0
      ? envProvider
      : (process.env.GEMINI_API_KEY?.trim()
        ? 'gemini'
        : process.env.OPENAI_API_KEY?.trim()
          ? 'openai'
          : process.env.ANTHROPIC_API_KEY?.trim()
            ? 'anthropic'
            : 'mock'));

  const model = provider === 'gemini'
    ? (process.env.GEMINI_MODEL ?? 'gemini-2.5-flash')
    : provider === 'openai'
      ? (process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
      : provider === 'anthropic'
        ? (process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest')
        : 'mock';

  const keyScope = apiKey?.trim() ? `user-key:${hashToken(apiKey)}` : 'env-key';
  return `${provider}:${model}:${keyScope}`;
}

function safeParseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // 1. Remove markdown code block wraps (like ```json ... ``` or ``` ... ```)
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleaned.match(codeBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  // 2. Locate the first { or [ and last } or ] if there is outer noise
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const startIdx = (firstBrace !== -1 && firstBracket !== -1)
    ? Math.min(firstBrace, firstBracket)
    : (firstBrace !== -1 ? firstBrace : firstBracket);

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const endIdx = (lastBrace !== -1 && lastBracket !== -1)
    ? Math.max(lastBrace, lastBracket)
    : (lastBrace !== -1 ? lastBrace : lastBracket);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  return JSON.parse(cleaned) as T;
}

export interface AiTaskParams<T extends NonNullable<unknown>> {
  taskName: string;
  owner: string;
  repo: string;
  sha: string;
  paramHash?: string;
  systemPrompt: string;
  userPrompt: string;
  apiKey?: string;
  json?: boolean;
  mockFallback: () => T;
}

export async function executeAiTask<T extends NonNullable<unknown>>(
  params: AiTaskParams<T>
): Promise<{ data: T; cached: boolean }> {
  const providerEnv = process.env.AI_PROVIDER?.trim().toLowerCase();
  const hasApiKey = params.apiKey?.trim();
  const isMock = !hasApiKey && (!providerEnv || providerEnv === 'mock');

  if (isMock) {
    return { data: params.mockFallback(), cached: false };
  }

  const key = aiCacheKey(
    params.taskName,
    params.owner,
    params.repo,
    params.sha,
    params.paramHash ?? 'v1',
    getAiCacheDiscriminator(params.apiKey)
  );
  if (cache.has(key)) {
    return { data: cache.get<T>(key)!, cached: true };
  }

  const provider = await getAIProvider(params.apiKey);
  const raw = await aiQueue.add(() =>
    provider.complete(
      [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      { json: params.json }
    )
  );

  let result: T;
  if (params.json) {
    try {
      result = safeParseJSON<T>(raw);
    } catch {
      logApi(`ai/service/${params.taskName}`, {
        error: 'JSON parse failure',
        rawPayload: raw.slice(0, 500),
      });
      result = params.mockFallback();
    }
  } else {
    result = raw as unknown as T;
  }

  cache.set(key, result);
  return { data: result, cached: false };
}
