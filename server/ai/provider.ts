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
      if (user.includes('ELI5') || user.includes('completely new')) {
        return `### Welcome to the Repository! 👋

Think of this project as a **smart digital map** of a codebase. It takes a repository URL, analyzes its contents, and draws a visual graph of files, folders, and dependencies.

Here is the quick breakdown of how things flow:
1. **The Entrance (Landing Page)**: You paste a GitHub URL in the search bar.
2. **The Scanner (Backend)**: The app talks to the GitHub API, parses configuration manifests (like \`package.json\`), and maps dependencies.
3. **The Painter (Frontend Canvas)**: React Flow builds an interactive graph where you can zoom, click, and inspect files.
4. **The Helper (AI Intelligence)**: You can ask the AI to explain specific files or recommend clean refactoring suggestions.

**Main entry points:**
- \`src/main.tsx\`: Launches the React app.
- \`server/api-router.ts\`: Handles all backend API requests.`;
      }
      if (user.includes('refactoring improvements')) {
        return JSON.stringify({
          suggestions: [
            {
              title: 'Centralize State Management in Zustand',
              description: 'Right now, some components manage local states that overlap. Consider moving panel visibility states to the global VizState store.',
              category: 'State Management',
              files: ['src/pages/VizPage.tsx', 'src/components/viz/AISidebar.tsx'],
              risk: 'medium'
            },
            {
              title: 'centralize HTTP utilities',
              description: 'Duplicate fetch handling logic observed in server routers. Recommend centralizing custom json/error responders to the shared HTTP utility file.',
              category: 'DRY Principle',
              files: ['server/api-router.ts', 'server/utils/http.ts'],
              risk: 'low'
            },
            {
              title: 'Optimize React Flow Graph Node Re-renders',
              description: 'Custom nodes are re-rendering on hover, causing minor frame rate drops on large repositories. Wrap custom nodes with React.memo.',
              category: 'Performance',
              files: ['src/features/graph/nodes/index.tsx'],
              risk: 'high'
            }
          ]
        });
      }
      if (user.includes('scores (0 to 100)')) {
        return JSON.stringify({
          scores: {
            maintainability: 88,
            modularity: 92,
            readability: 84,
            architecture: 90,
            complexity: 76
          },
          summary: 'The repository exhibits a highly structured framework. Components are cleanly separated by domain, and custom React Flow elements are compartmentalized. The addition of standard environment configurations and cached service interfaces indicates strong architecture quality.'
        });
      }
      if (user.includes('Mermaid.js flowchart')) {
        return `\`\`\`mermaid
graph TD
  User[Developer Browser] -->|Requests| Router[Vite Dev API Router]
  Router -->|Parses GitHub| GitHubService[GitHub Tree Fetcher]
  Router -->|Orchestrates AI| AIService[AI Provider Manager]
  
  GitHubService -->|Manifest Contents| DepParser[Dependency Analyzer]
  GitHubService -->|File Tree| GraphBuilder[Graph Builder Engine]
  
  GraphBuilder -->|Positions Nodes| Layout[Dagre Layout Engine]
  Layout -->|Graph Nodes & Edges| UI[React Flow Canvas View]
  AIService -->|Markdown / JSON Summaries| UI
\`\`\``;
      }
      if (user.includes('developer "roast"')) {
        return `🔥 **The AI Repository Roast**

Oh, look! Another developer tool utilizing React Flow! Did you build this because reading directories in VS Code was too easy, or did you just want to feel like a sci-fi hacker zooming into a dependency tree?

Let's look at the structure:
- You have a directory named \`server\` and a directory named \`src\` inside the root. Nice separation of concerns, except Vite is running both as one giant middleware monster.
- A custom LRU cache that lives in-memory on a Vercel serverless function... that's like putting a state-of-the-art vault inside a cardboard box that gets shredded every 15 minutes on cold starts.
- TypeScript typings defined everywhere, yet half of the network payloads are still labeled \`any\` under the hood. "Type-safety" is more of a wish list than a feature here, isn't it?

*Keep up the vibe-coding! At least the dark mode gradient looks absolutely beautiful.*`;
      }
      if (user.includes('enhanced, professional, and clean README.md')) {
        return `# 🔮 gitSdm — AI-Powered Repository Intelligence Platform

> Instantly visualize, understand, and optimize codebase architecture.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![GitHub Stars](https://img.shields.io/github/stars/mbayue/gitSdm?style=flat&color=violet)](https://github.com/mbayue/gitSdm)
[![MIT License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 🚀 Key Features

* **Interactive Codebase Mapping**: Glowing node visualizer showing configurations, tests, source files, and dependencies.
* **AI Architecture Summaries**: Understand module interaction, entry points, and systems flow instantly.
* **ELI5 mode**: Perfect for onboarding new engineers on complex, multi-layered codebases.
* **Health Dashboard & Refactoring**: Discover bottlenecks, coupled modules, and code duplication before they hit production.
* **Mermaid Flowchart Generator**: Instantly export visual diagrams to copy-paste into internal developer wikis.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Flow, Zustand, Framer Motion
- **Backend**: Node.js API Router, Octokit, Google Gemini API
`;
      }
      return `This is a mock AI explanation. Configure AI_PROVIDER=openai, anthropic, or gemini with API keys for real summaries.\n\nContext preview:\n${user.slice(0, 500)}`;
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
