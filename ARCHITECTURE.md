# Architecture

`gitSdm` is a graph-first repository analysis application. It visualizes file dependencies, architecture diagrams, module hierarchies, commit history, and AI-driven codebase insights in a single-page app with an embedded Express backend and Vercel serverless functions.

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
│  │ (Gemini/OAI/Anth/Edge) │  │  (Chunking/Embed/QA)  │  │  (200 items)   │  │
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
  - EdgeOne Makers (`@makers/deepseek-v4-flash`)
  - Offline Mock Provider (fixtures for testing and development without API keys)
- **AI Tasks (`server/ai/tasks/`):** Dedicated pipelines for architectural summaries, Mermaid flowchart generation, onboarding tours, refactoring risk detection, and dependency health audits.

### 4. Semantic Search & QA Engine

- **Chunker & Embedding Pipeline (`server/search/`):** Breaks repository files into semantic code chunks, computes embeddings, and indexes them in an in-memory vector store with cosine similarity search.
- **Natural Language QA:** Synthesizes context-aware answers to user queries referencing specific source lines.

### 5. State Management & Data Flow

- **Global UI State (`src/stores/vizStore.ts`):** Zustand store persisted to `localStorage` via `zustand/middleware/persist` for filters, layout preferences, and active workspace modes.
- **Server State:** TanStack React Query handles server queries with stale-while-revalidate semantics and query keys keyed by `[resource, owner, repo, branch]`.

---

## Directory Layout

```text
gitSdm/
├── api/                    # Vercel serverless entry points (thin wrappers)
│   ├── ai/                 # AI task endpoint wrappers
│   ├── repo/               # Repository analysis endpoint wrappers
│   └── trending.ts         # Trending repositories endpoint
├── server/                 # Backend services & router
│   ├── ai/                 # AI provider abstraction, prompts, and task handlers
│   │   └── tasks/          # Individual AI task logic (diagram, explain, onboarding, playground, refactor)
│   ├── cache/              # LRU caching layer
│   ├── config/             # Runtime config & environment validation
│   ├── github/             # GitHub API client (Octokit) & mock fixtures
│   ├── graph/              # Graph building, node colors, and layout algorithms
│   ├── parser/             # Dependency analysis, file classification & manifest parsers
│   │   └── manifest-parsers/ # npm, pnpm, cargo, pip, go, maven workspace parsers
│   ├── router/             # Modular request route handlers (repo, AI, search)
│   ├── search/             # Semantic search, vector store & QA engine
│   ├── services/           # Application services (analyze-repo, churn, health, trending, npm-registry)
│   ├── utils/              # HTTP, context, and logging helpers
│   ├── api-router.ts       # Unified API router
│   ├── dev-api.ts          # Vite dev server middleware
│   ├── env.ts              # Environment variable exports
│   ├── prod-server.ts      # Express production server
│   └── vercel-handler.ts   # Serverless request handler
├── src/                    # Frontend SPA application
│   ├── app/                # App entry, router setup, and query client providers
│   ├── components/         # UI components organized by domain
│   │   ├── contributors/   # Contributor metrics and activity timeline
│   │   ├── explorer/       # File tree and code inspector dock
│   │   ├── home/           # Landing page (hero, input, preview, trending)
│   │   ├── layout/         # Top navbar and app layout
│   │   ├── theme/          # ThemeSync appearance controller
│   │   ├── timeline/       # Commit history and repo timeline views
│   │   ├── ui/             # shadcn/ui primitives & Base UI components
│   │   └── viz/            # Main visualization workspace
│   │       ├── ai-sidebar/ # Codebase intelligence tabs & action cards
│   │       ├── architecture/# Interactive Mermaid diagrams & zoom controls
│   │       ├── layout/     # Resizable sidebar & panel drawer
│   │       ├── learning-path/# Guided code walkthroughs
│   │       └── top-nav/    # Branch/tag switcher, stats & workspace mode controls
│   ├── features/           # Feature modules
│   │   ├── ai/             # AI task mutation hooks (useAiTasks)
│   │   ├── graph/          # Force graph & D3 canvas engine, widgets & export
│   │   │   ├── canvas/     # ForceGraphCanvas, GraphCanvas, and ToolbarDropdowns
│   │   │   │   ├── force/  # D3 physics, force painter, minimap, and sync
│   │   │   │   ├── helpers/# Filtering logic and helpers
│   │   │   │   ├── hooks/  # Canvas state hooks
│   │   │   │   └── widgets/# DropdownPanel, LegendPanel, FloatingControls, FilterSummary
│   │   │   └── force/      # Force graph data models, constants, and blast radius
│   │   └── search/         # Semantic search interface & indexing status
│   ├── hooks/              # Shared custom React hooks
│   ├── lib/                # API client, clipboard, and string helpers
│   ├── pages/              # Route pages (VizPage, HomePage, SearchPage, NotFoundPage)
│   ├── stores/             # Zustand global stores (vizStore)
│   ├── styles/             # Tailwind CSS 4 global theme
│   └── types/              # TypeScript domain types and DTOs
└── e2e/                    # Playwright end-to-end test suite
```

---

## Known Limitations

### Semantic search is in-memory only

The vector store backing semantic search (`server/search/vector-store.ts`) lives in process memory. On Vercel serverless, each cold start spins up a fresh instance with an empty index — so the first query after a cold start re-indexes the repository before returning results. Indexing is cached in the LRU layer for the lifetime of a warm instance, but there is no cross-instance persistence. For consistently fast search, prefer the Express production server (`bun start`) over the serverless deployment.
