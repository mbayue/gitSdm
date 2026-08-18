# gitSdm — Agent Guide

<!-- AGENTS.md: Single source of truth for AI agents working on this codebase. -->

## Project Identity

**gitSdm** (Git Software Dependency Map) — v2.8.0. Graph-first repository analysis tool: visualize file dependencies, AI-powered codebase insights, semantic search, commit timelines, architecture diagrams, and dependency health. Single-page app with an embedded Express backend + Vercel serverless functions.

---

## Tech Stack

| Layer          | Technology                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Runtime        | Bun 1.3.14 (package manager, test runner, TS executor)                                          |
| Frontend       | React 19, Vite 8, TypeScript 6, Tailwind CSS 4                                                  |
| State Mgmt     | Zustand 5 (global store) + TanStack React Query 5 (server state)                                |
| Routing        | react-router-dom v7                                                                             |
| UI Primitives  | shadcn/ui + @base-ui/react (Base UI), lucide-react v1 icons, Framer Motion 12, recharts         |
| Graph Viz      | react-force-graph-2d, d3-force                                                                  |
| Diagrams       | Mermaid 11, html-to-image, jsPDF                                                                |
| Backend        | Express (dev + prod server), Zod validation                                                     |
| AI Providers   | Gemini (default), OpenAI, Anthropic — unified via `createProvider()`                            |
| GitHub API     | Octokit REST v21                                                                                |
| Search         | In-memory vector store with chunking + embedding + QA engine                                    |
| Security       | dompurify (sanitization)                                                                        |
| Code Display   | highlight.js (syntax highlighting)                                                              |
| Auth           | GitHub PAT (optional, for private repos / rate limits)                                          |

---

## Directory Layout

```text
gitSdm/
├── api/                 # Vercel serverless entry points (thin wrappers)
│   ├── ai/              # AI endpoint wrappers
│   ├── repo/            # Repo API endpoint wrappers
│   └── trending.ts      # Trending repos endpoint
├── server/              # Backend services & router
│   ├── ai/              # AI provider abstraction + task handlers
│   │   ├── prompts.ts           # Shared AI prompt templates
│   │   ├── provider.ts/test.ts  # AI provider (Gemini/OpenAI/Anthropic/Mock)
│   │   ├── service.ts/test.ts   # AI service orchestration
│   │   ├── summarizer.ts        # AI summarization
│   │   └── tasks/               # Individual AI tasks (diagram, explain, onboarding, playground, refactor)
│   ├── cache/           # LRU caching layer (lru.ts/test.ts)
│   ├── config/          # Env validation & public config (app-config.ts/test.ts)
│   ├── env.ts           # Environment variable exports
│   ├── github/          # GitHub API client (Octokit), fetch-tree, mock-data (+ test files)
│   ├── graph/           # Graph building algorithms (graph-builder.ts/test.ts, node-colors.ts)
│   ├── parser/          # Dependency analysis, file classifier, import resolver, complexity
│   │   ├── complexity-analyzer.ts
│   │   ├── dependency-analyzer.ts/test.ts
│   │   ├── file-classifier.ts/test.ts
│   │   ├── import-resolver.ts/test.ts
│   │   └── manifest-parsers/  # docker, go, java, npm, pip, rust + shared registry/types
│   ├── router/          # Route handlers (ai-routes, repo-routes, search-routes, schemas)
│   ├── search/          # Semantic search: chunker, embeddings, vector store, QA engine, indexing pipeline
│   ├── services/        # Business logic (analyze-repo, churn-service, dependency-health, get-file, npm-registry, trending)
│   ├── utils/           # Errors, context, logger, HTTP helpers
│   ├── api-router.ts    # Unified API router
│   ├── dev-api.ts       # Dev server API middleware
│   ├── prod-server.ts   # Production Express server
│   └── vercel-handler.ts # Vercel serverless entry
├── src/                 # Frontend SPA
│   ├── app/             # Router setup (router.tsx), app providers (providers.tsx)
│   ├── components/      # UI components organized by domain
│   │   ├── ui/          # shadcn primitives (badge, button, card, dropdown-menu, GlassCard, GlowButton, Input, separator, sheet, sidebar, Skeleton, SyntaxHighlighter, tabs, tooltip)
│   │   ├── viz/         # Main workspace: ai-sidebar/, architecture/, layout/, learning-path/, top-nav/
│   │   │   ├── ai-sidebar/   # AI center tab, action buttons, intelligence cards, markdown, tool cards
│   │   │   ├── architecture/ # Mermaid diagram generation + pan/zoom hooks
│   │   │   ├── layout/       # VizSidebar
│   │   │   ├── learning-path/# Focus layers
│   │   │   ├── top-nav/      # TopNav, BranchSwitcher, HeaderActionMenu, HeaderStats, viewTabs, WorkspaceModeSelector
│   │   │   ├── AIErrorCard.tsx, AISidebar.tsx, AnalysisTab.tsx, ArchitectureView.tsx
│   │   │   ├── BottomStatusBar.tsx, DependencyHealthTab.tsx, LearningPathTab.tsx
│   │   │   ├── OverviewTab.tsx, SettingsPopover.tsx, StagedLoader.tsx, VizError.tsx
│   │   ├── explorer/    # File explorer sidebar + code inspector dock (4 components)
│   │   ├── timeline/    # Commit history view + repo timeline
│   │   ├── contributors/# Contributor analytics
│   │   ├── home/        # Landing page: HeroSection, RepoInput, CapabilityGroups, StatsStrip, Trending, HowItWorks + repoPresets
│   │   ├── layout/      # Navbar
│   │   ├── theme/       # ThemeSync
│   │   └── ErrorBoundary.tsx
│   ├── features/        # Feature modules
│   │   ├── graph/       # Graph rendering canvas (ForceGraphCanvas, GraphCanvas), force engine, hooks, widgets, helpers, export
│   │   ├── ai/          # AI task frontend hooks (useAiTasks)
│   │   └── search/      # Semantic search UI: SearchBar, SearchResults, QAAnswerView, IndexingStatusPanel, ModeToggle, stores + hooks
│   ├── hooks/           # 7 shared hooks (useAnalyzeRepo, useCodeInspectorState, useMobile, useRepoBranches, useRepoTags, useVizDiff, useWorkspaceShortcuts)
│   ├── lib/             # Shared utilities: apiClient, clipboard, utils (+ test files)
│   ├── stores/          # Zustand stores (vizStore — canonical global store)
│   ├── pages/           # Route pages (VizPage, HomePage, SearchPage, NotFoundPage)
│   ├── types/           # TypeScript type definitions (api, domain, github, index)
│   ├── styles/          # Tailwind global CSS (globals.css)
│   ├── main.tsx         # App entry point
│   └── vite-env.d.ts    # Vite type declarations
├── public/              # Static assets
├── docs/                # Documentation (NAMING.md)
├── design-system/       # Design system definitions (gitsdm/)
├── scripts/             # Utility scripts (clean_graphify.py)
├── .github/             # CI workflows (ci.yml, codeql.yml, dependency-review.yml), issue/PR templates, copilot-instructions.md, dependabot.yml
├── .agent/              # Agent configuration
├── .agents/             # Agent skills/workflows
├── .codegraph/          # Codegraph index
├── .codex/              # Codex configuration
├── coverage/            # Test coverage reports
├── graphify-out/        # Graphify knowledge graph output
├── dist/                # Frontend build output
├── dist-server/         # Server build output
├── components.json      # shadcn/ui configuration
├── bunfig.toml          # Bun configuration
├── vercel.json          # Vercel deployment config
├── vite.config.ts       # Vite bundler config + plugin setup
├── eslint.config.js     # ESLint flat config
├── tsconfig.json        # TypeScript config (strict, path aliases @/ @server/)
├── tsconfig.app.json    # App-specific TS config
├── tsconfig.node.json   # Node-specific TS config
└── Dockerfile           # Docker build
```

---

## Key Architecture Patterns

### AI Provider Layer

All AI interactions go through `server/ai/provider.ts`. Do NOT call SDKs directly in task code.

```text
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
- `server/router/schemas.ts` — Zod schemas for request validation

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

Test runner: **Bun** (`bun test --isolate`). `--parallel` implies `--isolate` and defaults to CPU core count.

### Conventions

- Test files co-located: `foo.ts` → `foo.test.ts` (server side) or in `__tests__/` (some frontend)
- Uses `bun:test` — `describe`, `it`, `expect`, `mock`, `beforeEach`/`afterEach`
- Mocking: `mock.module('module-name', () => ({ ... }))` for external packages
- Spying: `spyOn(console, 'error').mockImplementation(() => {})` then `expect(spy).toHaveBeenCalled()`

### Known Issues

- **`mock.module()` leaks across parallel test files.** Mocks registered in one test file can
  affect other test files running in parallel workers — `--isolate` does NOT prevent this
  (`--parallel` implies `--isolate`, and parallel is the default). Symptom: a test passes alone
  but fails in the full run. Fix pattern: avoid `mock.module()` on modules that other test files
  import (e.g. `churn-service`); instead inject stubs through the function's own parameters
  (`RequestContext.octokit`) or mock a lower-level seam. `analyze-repo.test.ts` uses this pattern.
- `mock.restore()` resets ALL mocks including `mock.module()` overrides — be careful with global mock cleanup.
- Files that import from SDK packages (openai, @anthropic-ai/sdk) in tests must use `mock.module()` before any other imports.
- `bun test` (bunfig.toml) ignores `e2e/**` — browser tests are Playwright, not Bun.

### Coverage

- **35 test files, 361 tests passing** (889 expect calls), 0 failures
- `bun test --coverage` ≈ **99.3% funcs / 99.6% lines** (only `analyze-repo.ts` and `vector-store.ts` dip below 100%)

### E2E (Playwright)

- `bun run test:e2e` — 5 specs in `e2e/*.e2e.ts`. Requires `npx playwright install chromium` first.
- `playwright.config.ts` webServer builds, then starts the prod server on `:3000` with `AI_PROVIDER=mock`.

---

## Common Commands

```bash
bun dev              # Start dev server (frontend + backend)
bun test             # Run full test suite (--isolate)
bun test:watch       # Run tests in watch mode
bun test:coverage    # Run with coverage report
bun run build        # Production build (frontend)
bun run build:server # Build Express server for production
bun run build:docker # Frontend + server build for Docker
bun start            # Start production server (after build:docker)
bun run typecheck    # TypeScript check (tsc --noEmit)
bun run lint         # ESLint check
```

---

## Environment Variables

| Variable                 | Default                                    | Description                            |
| ------------------------ | ------------------------------------------ | -------------------------------------- |
| `GITHUB_TOKEN`           | —                                          | GitHub PAT for API rate limits         |
| `AI_PROVIDER`            | `mock`                                     | Provider: gemini, openai, anthropic, edgeone |
| `GEMINI_API_KEY`         | —                                          | Gemini API key                         |
| `OPENAI_API_KEY`         | —                                          | OpenAI API key                         |
| `ANTHROPIC_API_KEY`      | —                                          | Anthropic API key                      |
| `EDGEONE_API_KEY`        | —                                          | EdgeOne Makers Models API key (alias: `MAKERS_MODELS_KEY`) |
| `OPENAI_API_BASE`        | OpenAI default                             | Custom API base URL                    |
| `ANTHROPIC_API_BASE`     | Anthropic default                          | Custom API base URL                    |
| `EDGEONE_API_BASE`       | `https://ai-gateway.edgeone.link/v1`       | EdgeOne API base URL                   |
| `OPENAI_EMBEDDING_MODEL` | `openrouter/openai/text-embedding-3-large` | Embedding model                        |
| `EDGEONE_EMBEDDING_MODEL`| `openrouter/openai/text-embedding-3-large` | Embedding model                        |
| `EMBEDDING_DIMENSIONS`   | `3072`                                     | Vector dimension count                 |
| `GEMINI_MODEL`           | `gemini-2.5-flash`                         | Gemini model override                  |
| `GEMINI_API_VERSION`     | `v1alpha`                                  | Gemini API version                     |
| `OPENAI_MODEL`           | `gpt-4o-mini`                              | OpenAI model override                  |
| `ANTHROPIC_MODEL`        | `claude-3-5-haiku-latest`                  | Anthropic model override               |
| `EDGEONE_MODEL`          | `@makers/deepseek-v4-flash`                | EdgeOne model override                 |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001`                     | Gemini embedding model override        |
| `TOKEN_CACHE_HASH_SECRET`| —                                          | Cache key hashing secret (production)  |
| `HOST`                   | `0.0.0.0`                                  | Production server bind                 |
| `PORT`                   | `3000`                                     | Production server port                 |

---

## Git Conventions

- Branch naming: `feature/description`, `bugfix/description`, `chore/description`
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `refactor:`)

---

## Common Gotchas

1. **mock.module() leaks across parallel test files** — mocks registered in one file can affect
   others in the same run (`--isolate` does not help; parallel is default). Prefer dependency
   injection through parameters (`RequestContext.octokit`) over mocking shared service modules.
2. **mock.restore()**: Calling `mock.restore()` resets ALL mocks including `mock.module()` overrides. Use targeted `.mockRestore()` on individual spies instead.
3. **Vite + Bun**: The dev server runs `bunx --bun vite`. The `--bun` flag ensures Vite uses Bun's runtime. Building also uses `bunx --bun`.
4. **@anthropic-ai/sdk** is pre-1.0 — API changes may require provider.ts updates.
5. **DO NOT add new npm SDK dependencies for AI calls** — always route through the provider layer.
6. **Vercel serverless** (`api/` directory): Thin wrappers only. The real routing is in `server/router/`.
7. **graphify** (`bun run graphify:update`): Rerun after adding files or changing exports to keep the knowledge graph current.

---

## Health & Quality

- Zero `any` / `@ts-ignore` / `@ts-expect-error`
- Zero `console.error` in frontend `src/` (all user-facing errors use the toast system)
- Zero empty catch blocks
- Zero eval / injection vectors
- Zero hardcoded secrets
- 250+ LOC ceiling approached only by generated shadcn components

## CI

- `.github/workflows/ci.yml`: pinned Bun 1.3.14 (`setup-bun`). Jobs: lint, typecheck, test, build (with a 2.5 MB gzipped-JS bundle gate), e2e (`AI_PROVIDER=mock`).
- `bun install --frozen-lockfile` — always install with the lockfile frozen before running checks.
