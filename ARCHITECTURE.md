# Architecture

`gitSdm` is an interactive repository dependency visualization tool. It maps file dependencies, architecture diagrams, module hierarchies, commit history, and codebase insights in a single-page app with an embedded Express backend and Vercel serverless functions.

---

## High-Level System Architecture

```text
                          ┌─────────────────────────┐
                          │   GitHub REST API v21   │
                          └────────────┬────────────┘
                                       │ (Octokit)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Backend Layer (Server)                            │
│                                                                             │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐  │
│  │   Repo / AST Parser    │  │     Graph Builder     │  │  Churn & Health│  │
│  │ (Manifests, Deps, Loc) │─▶│ (Force & Tree Layout) │  │    Services    │  │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘  │
│                                          │                                  │
│  ┌────────────────────────┐  ┌───────────▼───────────┐  ┌────────────────┐  │
│  │   AI Provider Layer    │  │  In-Memory Vector DB  │  │   LRU Cache    │  │
│  │ (Gemini/OAI/Anth/Mock) │  │  (Chunking/Embed/QA)  │  │  (200 items)   │  │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (JSON REST API)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer (SPA React)                         │
│                                                                             │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐  │
│  │     Zustand Store      │  │  React Query (Cache)  │  │ React Router 7 │  │
│  │  (Global UI & Filters) │  │ (Analysis & Branches) │  │  (Deep Links)  │  │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘  │
│                                          │                                  │
│  ┌────────────────────────┐  ┌───────────▼───────────┐  ┌────────────────┐  │
│  │   Canvas Graph Engine  │  │   Mermaid Generator   │  │   AI Sidebar   │  │
│  │ (Force / D3 Physics)   │  │  (Zoom/Pan/Export)    │  │  (Intel Tools) │  │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Subsystems

### 1. Repository Analysis & Graph Construction

- **Manifest Parsers (`server/parser/manifest-parsers/`):** Analyzes `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, `pom.xml`, and Dockerfiles for monorepos, workspaces, and external dependencies.
- **Dependency & Import Analyzer (`server/parser/`):** Resolves local source imports (ESM, CJS, TypeScript, Go, Python, Rust) to build accurate containment and import dependency edges.
- **Graph Builder (`server/graph/graph-builder.ts`):** Converts raw nodes into a normalized graph model with node classifications (repo, package, folder, file), colors, and layout hints.

### 2. Visualization & Canvas Engine

- **Force Graph & D3 Physics (`src/features/graph/canvas/`):** Renders interactive 2D graphs via `react-force-graph-2d` and `d3-force`.
- **D3 Hierarchical Tree (`src/features/graph/canvas/force/useD3Physics.ts`):** Computes fixed horizontal and vertical tree layouts using `d3-hierarchy` with viewport auto-fitting.
- **Overlays & Heatmaps:**
  - **Code Churn:** Colors nodes by 90-day commit activity with multi-author ownership rings.
  - **Complexity Score:** Computes node sizes/colors from LOC, import count, and export count.
  - **Diff Highlighting:** Highlights additions, modifications, and deletions across Git branches/tags/SHAs.

### 3. AI Provider Layer & Intelligence Services

- **Unified Provider (`server/ai/provider.ts`):** Single `createProvider()` interface routing across:
  - Google Gemini (`gemini-2.5-flash`)
  - OpenAI (`gpt-4o-mini`)
  - Anthropic (`claude-3-5-haiku-latest`)
  - Offline Mock Provider (fixtures for testing and development without API keys)
- **Custom Endpoints & SSRF Guard (`server/ai/chat-config.ts`, `server/ai/public-chat-fetch.ts`):** Supports user-defined OpenAI-compatible base URLs and model overrides in Settings. Enforces SSRF security by verifying public HTTPS protocols, blocking internal/loopback/link-local IP addresses, and pinning DNS resolution.
- **Task Lifecycle & Cache Resilience (`src/features/ai/tool-cache.ts`):** In-memory task caching and deduplication ensure in-flight AI requests survive panel remounting and branch switching, while configuration revisions refresh stale cached responses on save.
- **Independent Embedding Pipeline (`server/search/embedding-config.ts`):** Decouples embedding credentials, models, and endpoints from chat settings to keep semantic search isolated.
- **AI Tasks (`server/ai/tasks/`):** Dedicated pipelines for architectural summaries, Mermaid flowchart generation, onboarding tours, refactoring risk detection, and dependency health audits.

### 4. Semantic Search & QA Engine

- **Chunker & Resumable Checkpoints (`server/search/checkpoints.ts`, `server/search/build-snapshot.ts`):** Splits supported repository files into AST/sliding-window code chunks, computes embeddings with rate-limit pacing, and saves intermediate batch checkpoints so interrupted builds resume seamlessly.
- **In-Memory Vector Store & LRU Eviction (`server/search/vector-store.ts`):** Fast cosine-similarity search store with strict byte budgets, 30-minute index lifetimes, and LRU eviction.
- **Natural Language QA (`server/search/qa-engine.ts`):** Synthesizes context-aware answers to user queries referencing specific source lines.

### 5. Server Guardrails & Usage Limits

- **SSRF Outbound Guard (`server/utils/url-guard.ts`):** Validates outbound HTTP/HTTPS destinations, expands IPv6 addresses to 8 hextets, checks transition prefixes (NAT64 `64:ff9b::/96`, 6to4 `2002::/16`), and rejects private, loopback, multicast, or documentation addresses.
- **Admission & Rate Limits (`server/utils/client-limits.ts`, `server/utils/usage-limits.ts`):** Enforces per-IP and deployment-wide request quotas, trusted proxy header chains, and daily server-funded AI/embedding budgets with Upstash Redis or local sliding windows.
- **Bounded Queues & Request Limits (`server/utils/bounded-queue.ts`, `server/utils/request-limits.ts`):** Caps concurrency and waiting queues with 10s wait and 30s execution timeouts, immediate abort cleanup, and strict 1 MB UTF-8 body limits.

### 6. State Management & Data Flow

- **Global UI State (`src/stores/vizStore.ts`, `src/stores/motionStore.ts`, `src/stores/chatConfigStore.ts`):** Zustand stores for workspace modes, filters, responsive drawers, motion preferences, and chat configuration revisions.
- **Server State:** TanStack React Query handles server queries with stale-while-revalidate semantics and query keys keyed by `[resource, owner, repo, branch]`.

---

## Directory Layout

```text
gitSdm/
├── api/                    # Vercel serverless entry points (thin wrappers)
│   ├── ai/                 # AI task endpoint wrappers
│   ├── repo/               # Repository analysis, churn, and health endpoints
│   └── trending.ts         # Trending repositories endpoint
├── server/                 # Backend services & router
│   ├── ai/                 # AI provider abstraction, chat config, SSRF protection, prompts & tasks
│   │   └── tasks/          # Individual AI task logic (diagram, explain, onboarding, playground, refactor)
│   ├── cache/              # LRU caching layer & hashed token secrets
│   ├── config/             # Runtime config & environment validation
│   ├── github/             # GitHub API client (Octokit) & mock fixtures
│   ├── graph/              # Graph building, node colors, and layout algorithms
│   ├── parser/             # Dependency analysis, file classification & manifest parsers
│   │   └── manifest-parsers/ # npm, pnpm, cargo, pip (PEP 621/Poetry), go, maven workspace parsers
│   ├── router/             # Modular request route handlers (repo, AI, search, schemas)
│   ├── search/             # Semantic search: chunker, embeddings, checkpoints, vector store & QA engine
│   ├── services/           # Application services (analyze-repo, churn, health, repo-enrichment, trending, npm-registry)
│   ├── utils/              # HTTP, context, client limits, request limits, SSRF guard, and logging helpers
│   ├── api-router.ts       # Unified API router
│   ├── dev-api.ts          # Vite dev server middleware
│   ├── env.ts              # Environment variable exports
│   ├── prod-server.ts      # Express production server
│   └── vercel-handler.ts   # Serverless request handler
├── src/                    # Frontend SPA application
│   ├── app/                # App entry, router setup, and query client providers
│   ├── components/         # UI components organized by domain
│   │   ├── contributors/   # Contributor metrics, activity timeline, and timeline layout
│   │   ├── explorer/       # File tree and code inspector dock
│   │   ├── home/           # Landing page (hero, input, preview, trending, presets, repo navigation)
│   │   ├── layout/         # Navbar, SiteFooter, InfoPageLayout, and PageMetadata
│   │   ├── theme/          # ThemeSync appearance controller
│   │   ├── timeline/       # Commit history and repo timeline views
│   │   ├── ui/             # shadcn/ui primitives, button-variants & Base UI components
│   │   └── viz/            # Main visualization workspace
│   │       ├── ai-sidebar/ # Codebase intelligence tabs & action cards
│   │       ├── architecture/# Interactive Mermaid diagrams & zoom controls
│   │       ├── layout/     # Resizable sidebar & panel drawer
│   │       ├── learning-path/# Guided code walkthroughs
│   │       ├── top-nav/    # Branch/tag switcher, stats & workspace mode controls
│   │       └── AIErrorCard, ChurnStatus, MotionSettings, SettingsPopover, StagedLoader, VizError
│   ├── features/           # Feature modules
│   │   ├── ai/             # AI task mutation hooks & resilient cache (useAiTasks, tool-cache)
│   │   ├── graph/          # Force graph & D3 canvas engine, widgets & export
│   │   │   ├── canvas/     # ForceGraphCanvas, GraphCanvas, and ToolbarDropdowns
│   │   │   │   ├── force/  # D3 physics, force painter, minimap, and sync
│   │   │   │   ├── helpers/# Filtering logic and helpers
│   │   │   │   ├── hooks/  # Canvas state hooks
│   │   │   │   └── widgets/# DropdownPanel, LegendPanel, FloatingControls, FilterSummary
│   │   │   └── force/      # Force graph data models, constants, and blast radius
│   │   └── search/         # Semantic search interface, controls, empty state, recovery & parsePaths
│   ├── hooks/              # Shared custom React hooks (useAnalyzeRepo, useMotionPreference, useRepoChurn, useRepoHealth)
│   ├── lib/                # API client, clipboard, motion-preference, page-metadata, churn-progress, and workspace-mode
│   ├── pages/              # Route pages (HomePage, VizPage, SearchPage, TermsPage, PrivacyPage, NotFoundPage)
│   ├── stores/             # Zustand global stores (vizStore, motionStore, chatConfigStore)
│   ├── styles/             # Tailwind CSS 4 global theme
│   └── types/              # TypeScript domain types, DTOs, and churn types
├── public/                 # Static assets (og-image.png/svg, robots.txt, sitemap.xml)
├── scripts/                # Build and prerender scripts (prerender.tsx, clean_graphify.py)
└── e2e/                    # Playwright end-to-end test suite
```

---

## Known Limitations

### Semantic search is in-memory only

The vector store backing semantic search (`server/search/vector-store.ts`) lives in process memory. On Vercel serverless, each cold start spins up a fresh instance with an empty index — so the first query after a cold start re-indexes the repository before returning results. Indexing is cached in the LRU layer for the lifetime of a warm instance, but there is no cross-instance persistence. For consistently fast search, prefer the Express production server (`bun start`) over the serverless deployment.
