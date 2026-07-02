# gitSdm — Agent Guide

<!-- AGENTS.md: Single source of truth for AI agents working on this codebase. -->

## Project Identity

**gitSdm** (Git Software Dependency Map) — v2.3.0. Graph-first repository analysis tool: visualize file dependencies, AI-powered codebase insights, semantic search, commit timelines, architecture diagrams, and dependency health. Single-page app with an embedded Express backend + Vercel serverless functions.

---

## Tech Stack

| Layer       | Technology                                               |
| ----------- | -------------------------------------------------------- |
| Runtime     | Bun 1.3 (package manager, test runner, TS executor)      |
| Frontend    | React 19, Vite 8, TypeScript 6, Tailwind CSS 4           |
| State Mgmt  | Zustand 5 (global store) + TanStack React Query 5 (server state) |
| UI Primitives | shadcn/ui (Base UI), lucide-react icons, Framer Motion 12 |
| Graph Viz   | react-force-graph-2d, d3-force, @xyflow/react (ReactFlow) |
| Diagrams    | Mermaid 11, html-to-image, jsPDF                          |
| Backend     | Express (dev + prod server), Zod validation               |
| AI Providers | Gemini (default), OpenAI, Anthropic — unified via `createProvider()` |
| GitHub API  | Octokit REST v21                                          |
| Search      | In-memory vector store with chunking + embedding + QA engine |
| Auth        | GitHub PAT (optional, for private repos / rate limits)     |

---

## Directory Layout

```
gitSdm/
├── api/                 # Vercel serverless entry points (thin wrappers)
│   └── ai/              # AI endpoint wrappers (architecture, explain, suggest-files — mostly deleted)
├── server/              # Backend services & router
│   ├── ai/              # AI provider abstraction + task handlers (summarizer.ts)
│   │   └── tasks/       # Individual AI tasks (explain, onboarding, playground — deprecated)
│   ├── config/          # Env validation & public config
│   ├── github/          # GitHub API client (Octokit), fetch-tree, mock-data
│   ├── graph/           # Graph building algorithms from repo structure
│   ├── parser/          # Dependency analysis, file classifier, import resolver
│   │   └── manifest-parsers/  # npm/pip/go/rust/java/docker workspace detection
│   ├── router/          # Route handlers (ai-routes, repo-routes, search-routes)
│   ├── search/          # Semantic search: chunker, embeddings, vector store, QA engine
│   ├── services/        # Business logic (analyze-repo, trending, npm-registry, etc.)
│   └── utils/           # Errors, context, logger, HTTP helpers
├── src/                 # Frontend SPA
│   ├── app/             # Router setup, app providers
│   ├── components/      # UI components organized by domain
│   │   ├── ui/          # shadcn primitives (button, card, tooltip, etc.)
│   │   ├── viz/         # Main workspace: architecture, ai-sidebar, learning-path, top-nav
│   │   ├── explorer/    # File explorer sidebar + code inspector dock
│   │   ├── timeline/    # Commit history view
│   │   ├── contributors/ # Contributor analytics
│   │   └── home/        # Landing page sections
│   ├── features/        # Feature modules
│   │   ├── graph/       # Graph rendering (ForceGraph canvas, ReactFlow, panels, nodes)
│   │   ├── ai/          # AI task frontend hooks (useAiTasks)
│   │   └── search/      # Semantic search UI integration
│   ├── hooks/           # Shared React hooks (useAnalyzeRepo, useRepoBranches, etc.)
│   ├── lib/             # Shared utilities: apiClient, clipboard, utils
│   ├── stores/          # Zustand stores (vizStore — canonical global store)
│   ├── pages/           # Route pages (VizPage, HomePage, SearchPage)
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Tailwind global CSS
```

---

## Key Architecture Patterns

### AI Provider Layer

All AI interactions go through `server/ai/provider.ts`. Do NOT call SDKs directly in task code.

```
Task handler → summarizer.ts → createProvider(type) → { Gemini | OpenAI | Anthropic } provider
```

- Uses `createProvider(overrideKey?)` → returns `AIProvider` with `.complete(messages, options?)`
- Auto-detects provider from `AI_PROVIDER` env var or API key prefix (`sk-ant-` → Anthropic, `sk-` → OpenAI)
- Fallback to `mock` provider when no keys configured (returns hardcoded responses)
- Embeddings also go through a provider layer in `server/search/embedding-provider.ts`

### State Management

- **Zustand** (`src/stores/vizStore.ts`): Global UI state — active view, sidebar state, filters, toast messages, theme, selected branch/comparison, zoom, etc. Persisted to localStorage via `zustand/middleware/persist`.
- **React Query** (`useQuery` / `useMutation`): All server state (repo analysis, file contents, branches, AI responses, search results). Cache keys follow `['resource', ...params]` convention.

### Backend Router

Not Express routers — a manual pathname-matching pattern in `server/router/`. Each route file exports a `handleXRoutes(pathname, req, ...)` function. The dev server (`server/dev-api.ts`) and prod server (`server/prod-server.ts`) call these.

Available route handlers:
- `server/router/ai-routes.ts` — `/api/ai/explain`, `/api/ai/learning-path`, `/api/ai/mermaid`, `/api/ai/health`, etc.
- `server/router/repo-routes.ts` — `/api/repo/analyze`, `/api/repo/files`, `/api/repo/branches`, etc.
- `server/router/search-routes.ts` — `/api/search/query`, `/api/search/status`, `/api/search/index`

### API Client (Frontend)

`src/lib/apiClient.ts` — Typed fetch wrapper. All API calls go through `apiFetch<T>(url, options?)`. Authentication tokens stored in `localStorage` (`gitsdm_gemini_api_key`, `gitsdm_github_pat`) and sent as `X-Gemini-API-Key` / `X-GitHub-Token` headers.

### Toast Notification Pattern

Error feedback uses the vizStore `toastMessage` system:
- `setToastMessage('message')` from `useVizStore((s) => s.setToastMessage)`
- Auto-dismisses after 3 seconds
- Rendered in `VizPage.tsx` as an animated card at bottom-right
- For errors, use: `setToastMessage('Failed to X: ' + (err instanceof Error ? err.message : String(err)))`
- A shared `copyToClipboard` utility is available at `@/lib/clipboard.ts`

---

## Code Conventions

### TypeScript

- **Strict mode** enabled. No `as any`, `@ts-ignore`, or `@ts-expect-error` anywhere (verified by audit).
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- Path aliases: `@/` → `src/`, `@server/` → `server/`
- `isolatedModules: true` — each file is compiled independently. No `const enum` or cross-file type re-exports that break isolation.

### Imports

- Use path aliases: `import { X } from '@/components/ui/button'`
- Make sure test files whose paths end with `.test.ts` never re-export types that cause `isolatedModules` violations in Vite.

### Naming

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Functions: `camelCase` — `useQuery` hooks prefixed with `use`, handlers prefixed with `handle`
- Components: `PascalCase`, exported as named exports (no default exports)
- Types/Interfaces: `PascalCase` — prefixed with `I` only to disambiguate (rare)

### CSS

- Tailwind CSS 4 with `tw-animate-css` for animations
- Dark theme is default. Theme classes use `dark:` / `light:` variants
- Custom theme vars defined in Tailwind config / CSS `@theme`

---

## Testing Patterns

Test runner: **Bun** (`bun test --isolate`)

### Conventions
- Test files co-located: `foo.ts` → `foo.test.ts` (server side) or in `__tests__/` (some frontend)
- Uses `bun:test` — `describe`, `it`, `expect`, `mock`, `beforeEach`/`afterEach`
- Mocking: `mock.module('module-name', () => ({ ... }))` for external packages
- Spying: `spyOn(console, 'error').mockImplementation(() => {})` then `expect(spy).toHaveBeenCalled()`

### Known Issues
- **10 pre-existing test isolation failures** when running full suite (pass individually). Root cause: `global.fetch` mock pollution leaks between test files. The `--isolate` flag is already passed.
- `mock.restore()` resets ALL mocks including `mock.module()` overrides — be careful with global mock cleanup.
- Files that import from SDK packages (openai, @anthropic-ai/sdk) in tests must use `mock.module()` before any other imports.

### Coverage
- **31 test files**: 22 server-side (AI, graph, parser, search, services, utils), 4 frontend (components, lib, graph utils)
- **320+ tests** passing, 10 pre-existing failures

---

## Common Commands

```bash
bun dev              # Start dev server (frontend + backend)
bun test             # Run full test suite (--isolate)
bun test:watch       # Run tests in watch mode
bun test:coverage    # Run with coverage report
bun run build        # Production build
bun run typecheck    # TypeScript check (tsc --noEmit)
bun run lint         # ESLint check
```

---

## Environment Variables

| Variable                  | Default                     | Description                            |
| ------------------------- | --------------------------- | -------------------------------------- |
| `GITHUB_TOKEN`            | —                           | GitHub PAT for API rate limits         |
| `AI_PROVIDER`             | `mock`                      | Provider: gemini, openai, anthropic    |
| `GEMINI_API_KEY`          | —                           | Gemini API key                         |
| `OPENAI_API_KEY`          | —                           | OpenAI API key                         |
| `ANTHROPIC_API_KEY`       | —                           | Anthropic API key                      |
| `OPENAI_API_BASE`         | OpenAI default              | Custom API base URL                    |
| `ANTHROPIC_API_BASE`      | Anthropic default           | Custom API base URL                    |
| `OPENAI_EMBEDDING_MODEL`  | `openrouter/openai/text-embedding-3-large` | Embedding model        |
| `EMBEDDING_DIMENSIONS`    | `3072`                      | Vector dimension count                 |
| `HOST`                    | `0.0.0.0`                   | Production server bind                 |
| `PORT`                    | `3000`                      | Production server port                 |

---

## Git Conventions

- Branch naming: `feature/description`, `bugfix/description`, `chore/description`
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `refactor:`)
- Emoji prefixes for significant changes: `⚡ Bolt:` (perf), `🛡️ Sentinel:` (security), `🎨 Palette:` (UI)

---

## Common Gotchas

1. **Test isolation**: Running `bun test` without `--isolate` causes cross-file mock pollution. The `--isolate` flag is in the npm script, but some leakage still happens.
2. **mock.restore()**: Calling `mock.restore()` resets ALL mocks including `mock.module()` overrides. Use targeted `.mockRestore()` on individual spies instead.
3. **Vite + Bun**: The dev server runs `bunx --bun vite`. The `--bun` flag ensures Vite uses Bun's runtime. Building also uses `bunx --bun`.
4. **@anthropic-ai/sdk** is pre-1.0 — API changes may require provider.ts updates.
5. **DO NOT add new npm SDK dependencies for AI calls** — always route through the provider layer.
6. **Vercel serverless** (`api/` directory): Thin wrappers only. The real routing is in `server/router/`.
7. **graphify** (`bunx graphify update .`): Rerun after adding files or changing exports to keep the knowledge graph current.

---

## Health & Quality

- Zero `any` / `@ts-ignore` / `@ts-expect-error`
- Zero `console.error` in frontend `src/` (all user-facing errors use the toast system)
- Zero empty catch blocks
- Zero eval / injection vectors
- Zero hardcoded secrets
- 250+ LOC ceiling approached only by generated shadcn components
