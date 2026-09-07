# gitSdm — Agent Guide

<!-- AGENTS.md: Single source of truth for AI agents working on this codebase. -->

## Project Identity

**gitSdm** (Git Software Dependency Map) — v3.0.0. Graph-first repository analysis tool: visualize file dependencies, AI-powered codebase insights, semantic search, commit timelines, architecture diagrams, and dependency health. Single-page app with an embedded Express backend + Vercel serverless functions.

---

## Tech Stack

| Layer          | Technology                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Runtime        | Bun 1.3.14 (package manager, test runner, TS executor)                                          |
| Frontend       | React 19, Vite 8, TypeScript 6, Tailwind CSS 4                                                  |
| State Mgmt     | Zustand 5 (global store) + TanStack React Query 5 (server state)                                |
| Routing        | react-router-dom v7                                                                             |
| UI Primitives  | shadcn/ui + @base-ui/react (Base UI), lucide-react v1 icons, Framer Motion 12, recharts         |
| Graph Viz      | react-force-graph-2d, d3-force, d3-hierarchy                                                    |
| Diagrams       | Mermaid 11, html-to-image, jsPDF                                                                |
| Backend        | Express (dev + prod server), Zod validation                                                     |
| AI Providers   | Gemini, OpenAI, Anthropic, EdgeOne Makers, Mock — unified via `createProvider()`               |
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
│   │   ├── provider.ts/test.ts  # AI provider (Gemini/OpenAI/Anthropic/EdgeOne/Mock)
│   │   ├── service.ts/test.ts   # AI service orchestration
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
│   │   ├── ui/          # shadcn primitives & Base UI wrappers
│   │   ├── viz/         # Main workspace: ai-sidebar/, architecture/, layout/, learning-path/, top-nav/
│   │   │   ├── ai-sidebar/   # AI center tab, action buttons, intelligence cards, tool cards
│   │   │   ├── architecture/ # Mermaid diagram generation, pan/zoom, render-sequence guard
│   │   │   ├── layout/       # VizSidebar & panel drawers
│   │   │   ├── learning-path/# Guided code walkthroughs
│   │   │   ├── top-nav/      # TopNav, BranchSwitcher, HeaderActionMenu, HeaderStats, WorkspaceModeSelector
│   │   │   ├── AIErrorCard.tsx, AISidebar.tsx, AnalysisTab.tsx, ArchitectureView.tsx
│   │   │   ├── BottomStatusBar.tsx, DependencyHealthTab.tsx, LearningPathTab.tsx
│   │   │   ├── OverviewTab.tsx, SettingsPopover.tsx, StagedLoader.tsx, VizError.tsx
│   │   ├── explorer/    # File explorer sidebar + code inspector dock
│   │   ├── timeline/    # Commit history view + repo timeline
│   │   ├── contributors/# Contributor analytics
│   │   ├── home/        # Landing page: HeroSection, RepoInput, HomeGraphPreview, Trending, repoPresets
│   │   ├── layout/      # Navbar
│   │   ├── theme/       # ThemeSync
│   │   └── ErrorBoundary.tsx
│   ├── features/        # Feature modules
│   │   ├── graph/       # Graph canvas (ForceGraphCanvas, GraphCanvas, ToolbarDropdowns), widgets, force engine
│   │   │   ├── canvas/  # Canvas layout engine, hooks, helpers (filters), widgets (DropdownPanel, LegendPanel)
│   │   │   └── force/   # Force constants, color palettes, blastRadius, buildForceGraphData
│   │   ├── ai/          # AI task frontend hooks (useAiTasks)
│   │   └── search/      # Semantic search UI: SearchBar, SearchResults, QAAnswerView, IndexingStatusPanel
│   ├── hooks/           # Shared hooks (useAnalyzeRepo, useCodeInspectorState, useMobile, useRepoBranches, useRepoTags, useWorkspaceShortcuts)
│   ├── lib/             # Shared utilities: apiClient, clipboard, utils, file-context (+ test files)
│   ├── stores/          # Zustand stores (vizStore — canonical global store)
│   ├── pages/           # Route pages (VizPage, HomePage, SearchPage, NotFoundPage)
│   ├── types/           # TypeScript type definitions (api, domain, github, index)
│   ├── styles/          # Tailwind CSS global styles (globals.css, interface.css)
│   └── main.tsx         # App entry point
├── e2e/                 # Playwright end-to-end test specs (offline mock-driven)
└── public/              # Static assets
```

---

## Key Architecture Patterns

### AI Provider Layer

All AI interactions go through `server/ai/provider.ts`. Do NOT call SDKs directly in task code.

```text
Task handler → summarizer / task → createProvider(type) → { Gemini | OpenAI | Anthropic | EdgeOne | Mock }
```

- Uses `createProvider(overrideKey?)` → returns `AIProvider` with `.complete(messages, options?)`
- Auto-detects provider from `AI_PROVIDER` env var or API key prefix (`sk-ant-` → Anthropic, `sk-` → OpenAI)
- Fallback to `mock` provider when no keys configured (returns hardcoded responses)
- Embeddings route through `server/search/embedding-provider.ts`

### State Management

- **Zustand** (`src/stores/vizStore.ts`): Global UI state — active view, sidebar state, filters, toast messages, theme, selected branch/comparison, zoom, etc. Persisted to localStorage via `zustand/middleware/persist`.
  - *Gotcha:* Canvas components in read-only mode (e.g. `HomeGraphPreview`) must use explicit prop overrides (`colorModeOverride`, `sizeModeOverride`, `layoutTypeOverride`, `onVisibleCounts`) and early-return in canvas interaction handlers rather than writing to the persisted store.
- **React Query** (`useQuery` / `useMutation`): All server state (repo analysis, file contents, branches, AI responses, search results). Cache keys follow `['resource', ...params]` convention.

### Backend Router

Manual pathname-matching pattern in `server/router/`. Route files export `handleXRoutes(pathname, req, ...)` functions invoked by `server/dev-api.ts` (Vite middleware) and `server/prod-server.ts` (Express production).

- `server/router/ai-routes.ts` — `/api/ai/explain`, `/api/ai/learning-path`, `/api/ai/mermaid`, `/api/ai/health`, etc.
- `server/router/repo-routes.ts` — `/api/repo/analyze`, `/api/repo/files`, `/api/repo/branches`, etc.
- `server/router/search-routes.ts` — `/api/search/query`, `/api/search/status`, `/api/search/index`
- `server/router/schemas.ts` — Zod schemas for request validation

### API Client (Frontend)

`src/lib/apiClient.ts` — Typed fetch wrapper via `apiFetch<T>(url, options?)`. Authentication tokens stored in `localStorage` (`gitsdm_gemini_api_key`, `gitsdm_github_pat`) and sent as `X-Gemini-API-Key` / `X-GitHub-Token` headers.

### Toast Notification Pattern

Error feedback uses the vizStore `toastMessage` system:

- `setToastMessage('message')` from `useVizStore((s) => s.setToastMessage)`
- Auto-dismisses after 3 seconds; rendered in `VizPage.tsx`
- For errors, sanitize messages: never echo raw internal file paths or node IDs into user-facing toasts

---

## Code Conventions

### TypeScript

- **Strict mode** enabled. Zero `as any`, `@ts-ignore`, or `@ts-expect-error` anywhere.
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- Path aliases: `@/` → `src/`, `@server/` → `server/`
- `isolatedModules: true` — each file is compiled independently. No `const enum` or cross-file type re-exports that break isolation.

### Naming

- Files: `kebab-case.ts` for utilities/services, `PascalCase.tsx` for components
- Functions: `camelCase` — `useQuery` hooks prefixed with `use`, handlers prefixed with `handle`
- Components: `PascalCase`, exported as named exports (no default exports)
- Types/Interfaces: `PascalCase` — prefixed with `I` only to disambiguate (rare)

### CSS & UI

- Tailwind CSS 4 with `tw-animate-css` for animations
- Dark theme is default. Theme classes use `dark:` / `light:` variants
- Dropdown menus inside `.graph-toolbar` use the clamped `DropdownPanel` component to prevent clipping at canvas edges.

---

## Testing Patterns

Test runner: **Bun** (`bun test --isolate`).

### Conventions

- **Unit tests:** Co-located test files (`foo.ts` → `foo.test.ts`).
- **No jsdom in repo:** All unit tests are pure `bun:test` logic tests. For React components, extract pure decision helpers (e.g. `getAnalysisRelations`, `resolvePresetNavigation`, `shouldApplyRender`) and test the contract directly.
- **Mocking:** `mock.module('module-name', () => ({ ... }))` for external packages.
- **Spying:** `spyOn(console, 'error').mockImplementation(() => {})` then `expect(spy).toHaveBeenCalled()`.

### Known Testing Gotchas

1. **`mock.module()` leaks across parallel test workers.** `--isolate` does NOT prevent worker-level mock pollution. Avoid `mock.module()` on shared internal modules; inject stubs via parameters (`RequestContext.octokit`) or mock lower-level seams.
2. **`mock.restore()` resets ALL mocks** including `mock.module()` overrides. Use targeted `.mockRestore()` on individual spies instead.
3. **SDK imports:** Files importing from SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`) must declare `mock.module()` before imports in test files.
4. **`bun test` ignores `e2e/**`** (configured in `bunfig.toml`). Browser tests run via Playwright.

### Coverage & Test Counts

- **46 test files, 408 tests passing** (991 expect calls), 0 failures.
- Run a single test file: `bun test src/components/home/RepoInput.test.ts`
- Run test coverage: `bun test --coverage`

### E2E (Playwright)

- `bun run test:e2e` — 6 specs in `e2e/*.e2e.ts` (20 tests).
- All E2E specs run offline against `/mock/*` routes (`/mock/gitsdm`, `/mock/todo-app`) with `AI_PROVIDER=mock`, requiring zero external GitHub network access or tokens.
- Run a single E2E spec: `bunx playwright test e2e/home.e2e.ts`

---

## Common Commands

```bash
bun dev              # Start dev server (frontend + backend)
bun test             # Run full test suite (--isolate)
bun test <path>      # Run a single test file
bun test:watch       # Run tests in watch mode
bun test:coverage    # Run with coverage report
bun run test:e2e     # Run Playwright E2E suite (offline mock mode)
bun run build        # Production build (frontend)
bun run build:server # Build Express server for production
bun run build:docker # Frontend + server build for Docker
bun start            # Start production server (after build:server)
bun run typecheck    # TypeScript check (tsc --noEmit app + node)
bun run lint         # ESLint check
```

---

## Environment Variables

| Variable                 | Default                                    | Description                            |
| ------------------------ | ------------------------------------------ | -------------------------------------- |
| `GITHUB_TOKEN`           | —                                          | GitHub PAT for API rate limits         |
| `AI_PROVIDER`            | `mock`                                     | Provider: gemini, openai, anthropic, edgeone, mock |
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

## Health & Quality Rules

- Zero `any` / `@ts-ignore` / `@ts-expect-error`
- Zero `console.error` in frontend `src/` (all user-facing errors use the toast system)
- Zero empty catch blocks
- Zero eval / injection vectors
- Zero hardcoded secrets
- 250+ LOC ceiling approached only by generated shadcn components

## CI Requirements

- `.github/workflows/ci.yml`: Pinned Bun 1.3.14 (`setup-bun`), `permissions: contents: read`.
- All installs use `nick-invision/retry@v3` with `bun install --frozen-lockfile`.
- Jobs: `lint` -> `typecheck` -> `test` -> `build` (with 2.5 MB gzipped-JS bundle gate) -> `e2e` (`AI_PROVIDER=mock`).
