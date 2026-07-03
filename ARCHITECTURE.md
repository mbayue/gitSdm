# Architecture

```text
gitSdm/
├──  api/                    # Vercel serverless functions
│   ├── ai/                    # AI insight endpoints
│   └── repo/                  # Repository analysis endpoints
├──  assets/                 # Static images (graph.png)
├──  docs/                   # Project documentation (naming.md)
├──  public/                 # Static assets (including layout worker)
├──  scripts/                # Utility scripts (graphify cleanup)
├──  server/                 # Backend services & router
│   ├── ai/                    # AI provider, prompt & task handlers
│   │   └── tasks/             # Individual AI task handlers
│   ├── cache/                 # LRU caching layer
│   ├── config/                # App configuration & env validation
│   ├── github/                # GitHub API client
│   ├── graph/                 # Graph building & layout algorithms
│   ├── parser/                # Dependency & file analysis
│   │   └── manifest-parsers/  # Monorepo workspace detection
│   ├── router/                # Modular backend routers (AI, repo, search)
│   ├── search/                # Semantic search, embeddings & QA engine
│   ├── services/              # Business logic layer
│   └── utils/                 # HTTP, logging utilities
├──  src/                    # Frontend application
│   ├── app/                   # App providers & routing
│   ├── components/            # UI components
│   │   ├── contributors/      # Contributor analytics
│   │   ├── explorer/          # File explorer & code inspector dock
│   │   ├── home/              # Modular landing page sections
│   │   ├── layout/            # App shell layout (header, nav, etc.)
│   │   ├── theme/             # Theme toggle & appearance
│   │   ├── timeline/          # Commit timeline visualization
│   │   ├── ui/                # shadcn/ui primitives & styling wrapper
│   │   └── viz/               # Visual workspace modules
│   │       ├── ai-sidebar/    # Context-aware chat tabs & tools
│   │       ├── architecture/  # Mermaid configs & interactive generators
│   │       ├── layout/        # Viz sidebar & workspace layout
│   │       ├── learning-path/ # Code learning simulation player
│   │       └── top-nav/       # Branch switcher & stats menus
│   ├── features/              # Feature modules
│   │   ├── ai/                # AI task integration hooks
│   │   ├── graph/             # Graph rendering, styles & layout worker
│   │   │   ├── canvas/        # ReactFlow canvas engine
│   │   │   │   ├── force/     # D3 force simulation renderer
│   │   │   │   ├── helpers/   # Canvas utility functions
│   │   │   │   ├── hooks/     # Canvas interaction hooks
│   │   │   │   └── widgets/   # Canvas overlay widgets
│   │   │   ├── force/         # Force graph data & constants
│   │   │   ├── nodes/         # Custom node definitions
│   │   │   └── panels/        # Graph side panels
│   │   └── search/            # Semantic search integration
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Shared API client & utilities
│   ├── pages/                 # Route-level page components
│   ├── stores/                # Zustand global stores (e.g. vizStore)
│   ├── styles/                # Tailwind CSS global styles
│   └── types/                 # TypeScript definitions
```
