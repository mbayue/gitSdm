import { AsyncLocalStorage } from 'node:async_hooks';
import { hashToken } from '../cache/lru';
import { AppError } from '../utils/errors';

export interface ChatOverrides {
  provider?: string;
  model?: string;
  baseURL?: string;
}
export const chatOverrides = new AsyncLocalStorage<ChatOverrides>();
const clean = (value?: string | null) => value?.trim() || undefined;

export function readChatOverrides(headers: Headers, apiKey?: string): ChatOverrides {
  const provider = clean(headers.get('x-ai-provider'));
  const model = clean(headers.get('x-ai-model'));
  const baseURL = clean(headers.get('x-ai-base-url'));
  if (!provider && !model && !baseURL) return {};
  if (!clean(apiKey)) throw new AppError(400, 'Custom AI settings require your own API key.', 'INVALID_AI_CONFIG');
  if (provider && !['openai', 'gemini', 'anthropic'].includes(provider))
    throw new AppError(400, 'Choose a supported AI provider.', 'INVALID_AI_CONFIG');
  if (model && !/^[\x21-\x7e]{1,200}$/.test(model))
    throw new AppError(400, 'Model must contain 1–200 printable characters without spaces.', 'INVALID_AI_CONFIG');
  if (baseURL) {
    if (provider !== 'openai')
      throw new AppError(400, 'Custom base URLs require OpenAI-compatible chat.', 'INVALID_AI_CONFIG');
    let url: URL;
    try {
      url = new URL(baseURL);
    } catch {
      throw new AppError(400, 'Enter a valid HTTPS base URL.', 'INVALID_AI_CONFIG');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || baseURL.length > 2048)
      throw new AppError(400, 'Enter a public HTTPS base URL without credentials, query, or fragment.', 'INVALID_AI_CONFIG');
    return { provider, model, baseURL: url.href.replace(/\/+$/, '') };
  }
  return { provider, model };
}

export function resolveChatConfig(overrideKey?: string) {
  const custom = clean(overrideKey) ? chatOverrides.getStore() : undefined;
  const provider =
    custom?.provider ??
    (clean(overrideKey)
      ? overrideKey!.trim().startsWith('sk-ant-')
        ? 'anthropic'
        : overrideKey!.trim().startsWith('sk-')
          ? 'openai'
          : 'gemini'
      : (clean(process.env.AI_PROVIDER)?.toLowerCase() ??
        (clean(process.env.GEMINI_API_KEY)
          ? 'gemini'
          : clean(process.env.OPENAI_API_KEY)
            ? 'openai'
            : clean(process.env.ANTHROPIC_API_KEY)
              ? 'anthropic'
              : 'mock')));
  const prefix = provider.toUpperCase();
  const defaults: Record<string, string> = {
    openai: 'gpt-4o-mini',
    gemini: 'gemini-2.5-flash',
    anthropic: 'claude-3-5-haiku-latest',
    mock: 'mock',
  };
  return {
    provider,
    apiKey: clean(overrideKey) ?? clean(process.env[`${prefix}_API_KEY`]),
    model: custom?.model ?? clean(process.env[`${prefix}_MODEL`]) ?? defaults[provider],
    baseURL: custom?.baseURL ?? clean(process.env[`${prefix}_API_BASE`]),
    apiVersion: clean(process.env.GEMINI_API_VERSION) ?? 'v1alpha',
  };
}

export function chatIdentity(key?: string): string {
  return hashToken(JSON.stringify(resolveChatConfig(key)));
}
