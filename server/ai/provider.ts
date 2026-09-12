import { fetchPublicChat } from './public-chat-fetch';
import { chatOverrides } from './chat-config';
import { resolveChatConfig, chatIdentity } from './chat-config';
import { protectAI } from './provider-controls';
import { createMockProvider } from './mock-provider';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  complete(messages: Message[], options?: { json?: boolean; signal?: AbortSignal }): Promise<string>;
}

export async function createProvider(overrideKey?: string): Promise<AIProvider> {
  const { provider } = resolveChatConfig(overrideKey);
  switch (provider) {
    case 'openai':
      return createOpenAIProvider(overrideKey);
    case 'gemini':
      return createGeminiProvider(overrideKey);
    case 'anthropic':
      return createAnthropicProvider(overrideKey);
    case 'mock':
      return createMockProvider();
    default:
      throw new Error('Unsupported AI_PROVIDER. Use gemini, openai, anthropic, or mock.');
  }
}

async function createGeminiProvider(overrideKey?: string): Promise<AIProvider> {
  const { GoogleGenAI } = await import('@google/genai');
  const { apiKey, model, apiVersion } = resolveChatConfig(overrideKey);

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required when using Gemini provider');
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion, httpOptions: { timeout: 30000, retryOptions: { attempts: 1 } } });

  return protectAI(
    {
      async complete(messages, options) {
        const systemMessage = messages.find((m) => m.role === 'system');
        const systemInstruction = systemMessage?.content;

        const contents = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
            parts: [{ text: m.content }],
          }));

        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            abortSignal: options?.signal,
            maxOutputTokens: 4096,
            temperature: 0.2,
            systemInstruction,
            responseMimeType: options?.json ? 'application/json' : undefined,
          },
        });

        return response.text ?? '';
      },
    },
    !overrideKey,
  );
}

async function createOpenAIProvider(overrideKey?: string): Promise<AIProvider> {
  const { default: OpenAI } = await import('openai');
  const { apiKey, model, baseURL } = resolveChatConfig(overrideKey);
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
  }
  const client = new OpenAI({
    apiKey,
    timeout: 30000,
    maxRetries: 0,
    fetch: overrideKey && chatOverrides.getStore()?.baseURL
      ? fetchPublicChat
      : (input, init) => fetch(input, { ...init, redirect: 'error' }),
  });
  if (baseURL) {
    client.baseURL = baseURL;
  }

  return protectAI(
    {
      async complete(messages, options) {
        const response = await client.chat.completions.create(
          {
            model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            max_tokens: 4096,
            temperature: 0.2,
            response_format: options?.json ? { type: 'json_object' } : undefined,
          },
          { signal: options?.signal },
        );
        return response.choices[0]?.message?.content ?? '';
      },
    },
    !overrideKey,
  );
}

async function createAnthropicProvider(overrideKey?: string): Promise<AIProvider> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const { apiKey, model, baseURL } = resolveChatConfig(overrideKey);
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required when using Anthropic provider');
  }
  const client = new Anthropic({ apiKey, timeout: 30000, maxRetries: 0 });
  if (baseURL) {
    client.baseURL = baseURL;
  }

  return protectAI(
    {
      async complete(messages, options) {
        const system = messages.find((m) => m.role === 'system')?.content ?? '';
        const userMessages = messages.filter((m) => m.role !== 'system');

        const response = await client.messages.create(
          {
            model,
            max_tokens: 4096,
            system,
            messages: userMessages.map((m) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
          },
          { signal: options?.signal },
        );

        const block = response.content[0];
        return block?.type === 'text' ? block.text : '';
      },
    },
    !overrideKey,
  );
}

let providerInstance: AIProvider | null = null;
let providerInstanceKey: string | null = null;

export async function getAIProvider(overrideKey?: string): Promise<AIProvider> {
  // User-provided key: always create a fresh instance (no caching across users)
  if (overrideKey) {
    return createProvider(overrideKey);
  }
  const currentKey = chatIdentity();
  if (!providerInstance || providerInstanceKey !== currentKey) {
    providerInstance = await createProvider();
    providerInstanceKey = currentKey;
  }
  return providerInstance;
}
