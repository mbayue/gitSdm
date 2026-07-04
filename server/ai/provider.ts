import { createMockProvider } from './mock-provider';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  complete(messages: Message[], options?: { json?: boolean }): Promise<string>;
}

function detectProviderType(key: string): 'gemini' | 'openai' | 'anthropic' {
  const trimmed = key.trim();
  if (trimmed.startsWith('sk-ant-')) {
    return 'anthropic';
  }
  if (trimmed.startsWith('sk-')) {
    return 'openai';
  }
  return 'gemini';
}

export async function createProvider(overrideKey?: string): Promise<AIProvider> {
  if (overrideKey && overrideKey.trim()) {
    const type = detectProviderType(overrideKey);
    switch (type) {
      case 'openai':
        return createOpenAIProvider(overrideKey);
      case 'anthropic':
        return createAnthropicProvider(overrideKey);
      case 'gemini':
      default:
        return createGeminiProvider(overrideKey);
    }
  }

  // Auto-detect provider based on available environment API keys
  let providerType: 'gemini' | 'openai' | 'anthropic' | 'mock' = 'mock';

  // AI_PROVIDER takes explicit precedence over key-based auto-detection
  if (process.env.AI_PROVIDER) {
    const envProvider = process.env.AI_PROVIDER.toLowerCase();
    if (envProvider === 'gemini' || envProvider === 'openai' || envProvider === 'anthropic' || envProvider === 'mock') {
      providerType = envProvider as 'gemini' | 'openai' | 'anthropic' | 'mock';
    }
  } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    providerType = 'gemini';
  } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    providerType = 'openai';
  } else if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
    providerType = 'anthropic';
  }

  switch (providerType) {
    case 'openai':
      return createOpenAIProvider();
    case 'anthropic':
      return createAnthropicProvider();
    case 'gemini':
      return createGeminiProvider();
    default:
      return createMockProvider();
  }
}

async function createGeminiProvider(overrideKey?: string): Promise<AIProvider> {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = overrideKey ?? process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const apiVersion = process.env.GEMINI_API_VERSION ?? 'v1alpha';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required when using Gemini provider');
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion });

  return {
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
          maxOutputTokens: 4096,
          temperature: 0.2,
          systemInstruction,
          responseMimeType: options?.json ? 'application/json' : undefined,
        },
      });

      return response.text ?? '';
    },
  };
}

async function createOpenAIProvider(overrideKey?: string): Promise<AIProvider> {
  const { default: OpenAI } = await import('openai');
  const apiKey = overrideKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
  }
  const client = new OpenAI({ apiKey });
  if (process.env.OPENAI_API_BASE) {
    client.baseURL = process.env.OPENAI_API_BASE;
  }
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return {
    async complete(messages, options) {
      const response = await client.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
        temperature: 0.2,
        response_format: options?.json ? { type: 'json_object' } : undefined,
      });
      return response.choices[0]?.message?.content ?? '';
    },
  };
}

async function createAnthropicProvider(overrideKey?: string): Promise<AIProvider> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const apiKey = overrideKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required when using Anthropic provider');
  }
  const client = new Anthropic({ apiKey });
  if (process.env.ANTHROPIC_API_BASE) {
    client.baseURL = process.env.ANTHROPIC_API_BASE;
  }
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest';

  return {
    async complete(messages) {
      const system = messages.find((m) => m.role === 'system')?.content ?? '';
      const userMessages = messages.filter((m) => m.role !== 'system');

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system,
        messages: userMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      });

      const block = response.content[0];
      return block?.type === 'text' ? block.text : '';
    },
  };
}


let providerInstance: AIProvider | null = null;
let providerInstanceKey: string | null = null;

export async function getAIProvider(overrideKey?: string): Promise<AIProvider> {
  // User-provided key: always create a fresh instance (no caching across users)
  if (overrideKey) {
    return createProvider(overrideKey);
  }
  // Cache by the resolved provider type so changing AI_PROVIDER invalidates the cache
  const currentKey = process.env.AI_PROVIDER ?? process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock';
  if (!providerInstance || providerInstanceKey !== currentKey) {
    providerInstance = await createProvider();
    providerInstanceKey = currentKey;
  }
  return providerInstance;
}
