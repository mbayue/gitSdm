# Repository Naming System

## Project identity

- Package name: `gitsdm`
- Public display name: `gitSdm`
- Storage/cache prefix: `gitsdm:`

Use lowercase `gitsdm` for package metadata and machine identifiers. Use `gitSdm` only for product-facing UI copy, README text, and branding.

## Directory naming

Use lowercase domain names for folders.

### Top-level folders

- `src/` — frontend application
- `server/` — backend runtime, services, domain logic
- `api/` — Vercel/serverless API entrypoints
- `tests/` — cross-cutting tests
- `docs/` — project documentation
- `scripts/` — maintenance scripts
- `public/` — static public assets
- `assets/` — repository assets for docs/README

### Frontend folders

- `src/app/` — app providers and routing
- `src/pages/` — route-level React pages
- `src/features/` — feature modules with state/hooks/logic
- `src/components/` — reusable UI and domain UI components
- `src/hooks/` — shared hooks
- `src/lib/` — shared frontend utilities
- `src/stores/` — shared Zustand stores
- `src/types/` — shared frontend/domain types
- `src/styles/` — global styles

### Backend folders

- `server/ai/` — AI providers, prompts, summarization, AI tasks
- `server/cache/` — cache store and cache key helpers
- `server/config/` — runtime/public config
- `server/github/` — GitHub provider/client logic
- `server/graph/` — graph building and layout
- `server/parser/` — manifest, dependency, import, file parsing
- `server/router/` — API route handlers and schemas
- `server/search/` — semantic search, indexing, embeddings, QA
- `server/services/` — app-level service orchestration
- `server/utils/` — backend utilities

## File naming

### React components

Use PascalCase.

Examples:

- `HeroSection.tsx`
- `SearchBar.tsx`
- `AISidebar.tsx`
- `GraphCanvas.tsx`

### Hooks

Use `useThing.ts`.

Examples:

- `useAnalyzeRepo.ts`
- `useWorkspaceShortcuts.ts`
- `useRepoBranches.ts`

Avoid generic names like `hooks.ts` for feature logic. Prefer specific hook files:

- `useSemanticSearch.ts`
- `useSemanticAsk.ts`
- `useIndexingStatus.ts`

### Stores

Use camelCase with `Store` suffix.

Examples:

- `vizStore.ts`
- `searchStore.ts`

### Backend modules

Use kebab-case.

Examples:

- `api-router.ts`
- `fetch-tree.ts`
- `graph-builder.ts`
- `dependency-analyzer.ts`

### Tests

Use same base filename plus `.test.ts` or `.test.tsx`.

Examples:

- `service.test.ts`
- `graph-builder.test.ts`
- `repoPresets.test.ts`

### shadcn/ui components

Keep registry-style lowercase/kebab-case names.

Examples:

- `button.tsx`
- `dropdown-menu.tsx`
- `separator.tsx`

Custom high-level UI may use PascalCase:

- `GlassCard.tsx`
- `GlowButton.tsx`

## Symbol naming

### Functions and variables

Use camelCase.

Examples:

- `analyzeRepo`
- `fetchRepoBranches`
- `parseRepoFromUrl`
- `handleApiRequest`

### React components

Use PascalCase.

Examples:

- `HomePage`
- `SearchPage`
- `ModeToggle`
- `IndexingStatusPanel`

### Types and interfaces

Use PascalCase nouns.

Examples:

- `RepoAnalysis`
- `GraphNode`
- `GitHubTreeItem`
- `IndexingStatus`

Use request/response suffixes for API DTOs:

- `AIExplainRequest`
- `AIExplainResponse`

### Constants

Use UPPER_SNAKE for global constants and storage keys.

Examples:

- `LAST_REPO_KEY`
- `SESSION_KEY`
- `MOBILE_BREAKPOINT`

Scoped implementation constants may use camelCase when not exported.

## API route naming

Use kebab-case URL slugs and mirror them in `api/`.

Examples:

- `/api/repo/analyze` → `api/repo/analyze.ts`
- `/api/ai/learning-path` → `api/ai/learning-path.ts`
- `/api/ai/readme-enhance` → `api/ai/readme-enhance.ts`
- `/api/ai/suggest-files` → `api/ai/suggest-files.ts`

Avoid temporary names in public routes:

- Avoid: `explain-new`
- Prefer: `explain-file`, `explain-selection`, or one `/api/ai/explain` endpoint with explicit request mode

## Domain vocabulary

Use each term with one clear meaning.

- `repo` — app-level repository model/API
- `github` — GitHub provider/client implementation
- `graph` — graph data, nodes, edges, layout
- `viz` — visualization UI/workspace
- `search` — semantic search and ask flow
- `indexing` — embedding/index pipeline
- `explorer` — file tree/code inspector UI
- `ai` — AI provider and AI tasks

If `graph` and `viz` both appear near same code, keep boundary clear:

- `graph` builds or transforms graph data.
- `viz` renders or controls graph UI.

## Cache and storage keys

Use consistent prefixing:

- Browser storage: `gitsdm:<scope>:<name>`
- Server cache: `<domain>:<owner>/<repo>@<branch>:<kind>`

Examples:

- `gitsdm:search:recent`
- `gitsdm:last-repo`
- `ai:mbayue/gitSdm@main:architecture`
- `search:mbayue/gitSdm@main:index`

Avoid mixing underscores and colons in new keys.
