export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  complete(messages: Message[], options?: { json?: boolean }): Promise<string>;
}

export async function createProvider(): Promise<AIProvider> {
  const provider = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();
  switch (provider) {
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

async function createGeminiProvider(): Promise<AIProvider> {
  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const apiVersion = process.env.GEMINI_API_VERSION ?? 'v1alpha';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion });

  return {
    async complete(messages) {
      const prompt = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          // maxOutputTokens: 2048,
        },
      });

      return response.text ?? '';
    },
  };
}

async function createOpenAIProvider(): Promise<AIProvider> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return {
    async complete(messages, options) {
      const response = await client.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 2048,
        temperature: 0.2,
        response_format: options?.json ? { type: 'json_object' } : undefined,
      });
      return response.choices[0]?.message?.content ?? '';
    },
  };
}

async function createAnthropicProvider(): Promise<AIProvider> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest';

  return {
    async complete(messages) {
      const system = messages.find((m) => m.role === 'system')?.content ?? '';
      const userMessages = messages.filter((m) => m.role !== 'system');

      const response = await client.messages.create({
        model,
        max_tokens: 2048,
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

function createMockProvider(): AIProvider {
  return {
    async complete(messages) {
      const user = messages.find((m) => m.role === 'user')?.content ?? '';
      if (user.includes('architecture')) {
        return JSON.stringify({
          overview:
            'This repository follows a modular architecture with clear separation between API routes, shared server logic, and a React frontend. The visualization layer uses React Flow for interactive dependency graphs.',
          layers: [
            { name: 'Presentation', description: 'React + Vite SPA with Tailwind and Framer Motion' },
            { name: 'API', description: 'Serverless handlers for GitHub ingestion and AI' },
            { name: 'Core', description: 'Parsers, graph builder, and GitHub client' },
          ],
        });
      }
      if (user.includes('suggest')) {
        return JSON.stringify({
          files: [
            { path: 'README.md', reason: 'Project overview and setup', priority: 'high' },
            { path: 'package.json', reason: 'Dependencies and scripts', priority: 'high' },
            { path: 'src/main.tsx', reason: 'Application entry point', priority: 'high' },
          ],
        });
      }
      if (user.includes('onboarding')) {
        return JSON.stringify({
          steps: [
            { title: 'Read the README', description: 'Understand project purpose and setup', filePath: 'README.md' },
            { title: 'Explore package.json', description: 'Review dependencies and scripts', filePath: 'package.json' },
            { title: 'Start with src/', description: 'Browse the main source directory', filePath: 'src/' },
          ],
        });
      }
      return `This is a mock AI explanation. Configure AI_PROVIDER=openai, anthropic, or gemini with API keys for real summaries.\n\nContext preview:\n${user.slice(0, 500)}`;
    },
  };
}

let providerInstance: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (!providerInstance) {
    providerInstance = await createProvider();
  }
  return providerInstance;
}
