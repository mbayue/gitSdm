<h1 align="center">gitSdm (Git Software Dependency Map v2.0.0)</h1>

<p align="center">
  <strong>Graph-first repository analysis for exploring files, dependencies, modules, and architecture notes.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
  <a href="https://github.com/mbayue/gitSdm/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" /></a>
  <a href="https://github.com/mbayue/gitSdm/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mbayue/gitSdm/ci.yml?branch=master&style=for-the-badge&logo=github&label=CI" alt="CI" /></a>
  <a href="https://github.com/mbayue/gitSdm/wiki"><img src="https://img.shields.io/badge/Docs-Wiki-blue?style=for-the-badge&logo=github" alt="Docs" /></a>
  <a href="https://github.com/mbayue/gitSdm/issues"><img src="https://img.shields.io/github/issues/mbayue/gitSdm?style=for-the-badge&logo=github&label=Issues" alt="Issues" /></a>
</p>

---

## ✨ Overview

**gitSdm v2** transforms how developers understand unfamiliar codebases. Instead of spending hours reading through files and tracing dependencies, gitSdm provides **instant, interactive architecture visualization** powered by AI. v2 adds more complete repository metadata and clearer graph controls for navigating large codebases.

> _"The kind of deep insight that normally takes days of reading code — delivered in seconds."_

### 🎯 Value Proposition

| Problem                                | Solution                          |
| -------------------------------------- | --------------------------------- |
| 🕒 Hours spent onboarding to new repos | ⚡ Instant architecture overview  |
| 🔍 Manual dependency tracing           | 🕸️ Interactive dependency graph   |
| 📚 Scattered documentation             | 🤖 AI-generated code explanations |
| 🧩 Unclear module boundaries           | 🎯 Visual file classification     |

---

## 🏗️ Architecture

```
gitSdm/
├── 📁 api/                    # Vercel serverless functions
├── 📁 server/                 # Backend services & router
│   ├── ai/                    # AI provider, prompt & task handlers
│   ├── cache/                 # LRU caching layer
│   ├── config/                # App configuration & env validation
│   ├── github/                # GitHub API client
│   ├── graph/                 # Graph building & layout algorithms
│   ├── parser/                # Dependency & file analysis
│   ├── router/                # Modular backend routers (AI, repo, search)
│   ├── search/                # Semantic search, embeddings & QA engine
│   ├── services/              # Business logic layer
│   └── utils/                 # HTTP, logging utilities
├── 📁 src/                    # Frontend application
│   ├── app/                   # App providers & routing
│   ├── components/            # UI components
│   │   ├── explorer/          # File explorer & code inspector dock
│   │   ├── home/              # Modular landing page sections
│   │   ├── ui/                # shadcn/ui primitives & styling wrapper
│   │   └── viz/               # Visual workspace modules
│   │       ├── ai-sidebar/    # Context-aware chat tabs & tools
│   │       ├── architecture/  # Mermaid configs & interactive generators
│   │       ├── layout/        # Viz sidebar & workspace layout
│   │       ├── learning-path/ # Code learning simulation player
│   │       └── top-nav/       # Branch switcher & stats menus
│   ├── features/              # Feature modules
│   │   ├── ai/                # AI task integration hooks
│   │   └── graph/             # Graph rendering, styles & layout worker
│   │       └── canvas/        # ReactFlow & D3-force engines
│   │           └── force/     # Custom D3 minimap & canvas painters
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Shared API client & utilities
│   ├── pages/                 # Route-level page components
│   ├── stores/                # Zustand global stores (e.g. vizStore)
│   ├── styles/                # Tailwind CSS global styles
│   └── types/                 # TypeScript definitions
├── 📁 public/                 # Static assets (including layout worker)
└── 📁 .agents/                # AI agent configurations
```

---

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.1 (recommended runtime and package manager)
- **Node.js** >= 22 (alternative backend support)
- **GitHub Personal Access Token** (for API access)

### Installation

```bash
# Clone the repository
git clone https://github.com/mbayue/gitSdm.git
cd gitSdm

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

### Environment Configuration

| Variable             | Description                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| `GITHUB_TOKEN`       | Optional. Increases GitHub API rate limits for public repos                  |
| `AI_PROVIDER`        | `mock` (default), `gemini`,`openai`, or `anthropic`                          |
| `OPENAI_API_KEY`     | Required when `AI_PROVIDER=openai`                                           |
| `ANTHROPIC_API_KEY`  | Required when `AI_PROVIDER=anthropic`                                  |
| `GEMINI_API_KEY`     | Required when `AI_PROVIDER=gemini`                                           |
| `GEMINI_MODEL`       | Optional when `AI_PROVIDER=gemini`; defaults to `gemini-2.5-flash`           |
| `GEMINI_API_VERSION` | Optional when `AI_PROVIDER=gemini`; defaults to `v1alpha`                    |
| `OPENAI_MODEL`       | Optional when `AI_PROVIDER=openai`; defaults to `gpt-4o-mini`                |
| `ANTHROPIC_MODEL`    | Optional when `AI_PROVIDER=anthropic`; defaults to `claude-3-5-haiku-latest` |

### Development

```bash
# Start development server
bun dev
```

### Production Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Docker Deployment

The Docker image builds the Vite app, bundles a small Node server, serves static files from `dist/`, and handles `/api/*` using the same API router as development/Vercel.

```bash
# Build Docker image
docker build -t gitsdm .

# Run container
docker run -p 3000:3000 --env-file .env gitsdm
```

For minimal setup, `GITHUB_TOKEN` is optional but recommended. AI features use `AI_PROVIDER=mock` by default; set the matching API key when using `gemini`, `openai`, or `anthropic`.

### Google Cloud Run

```bash
# Deploy directly from source
gcloud run deploy gitsdm \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --env-vars-file .env
```

---

## 🧩 Core Features

### 🔬 **Repository Analysis**

- **Instant parsing** of any public GitHub repository
- **Dependency graph** generation with `d3-force` and `dagre` layout algorithms
- **File classification** by type (component, utility, config, etc.)
- **Module boundary detection** for architectural insights

### 🤖 **AI-Powered Insights**

- **Architecture summaries** via Google Gemini, OpenAI, or Anthropic Claude
- **Code explanations** for specific files and modules in `Standard` and `ELI5 (Explain It Like I'm 5)` modes
- **Smart file suggestions** based on context
- **Learning paths** for onboarding to new codebases

### 🕸️ **Interactive Visualization**

- **Force-directed graphs** with `@xyflow/react` (React Flow)
- **Real-time filtering** by file type, module, or dependency
- **Branch comparison** with visual diff
- **High-resolution exports** to PNG and PDF for dependency maps
- **Interactive Mermaid flowcharts** with SVG and PNG download support

### 📊 **Repository Intelligence**

- **Contributor analytics** with `recharts` visualizations
- **Commit timeline** and activity patterns
- **Trending repositories** discovery
- **File explorer** with syntax showing via `highlight.js`
- **Dynamic presets** that automatically adjust based on active AI provider configurations

---

## 🛠️ Technology Stack

### Frontend

| Technology             | Purpose                         |
| ---------------------- | ------------------------------- |
| React 19               | UI framework                    |
| TypeScript 6           | Type safety                     |
| Vite 8                 | Build tooling                   |
| @xyflow/react 12       | Graph visualization             |
| Framer Motion 12       | Animations                      |
| TanStack React Query 5 | Data fetching                   |
| Tailwind CSS 4.3       | Styling                         |
| shadcn/ui 4            | Component primitives            |
| Recharts 2             | Charts & analytics              |
| Mermaid 11             | Diagram generation              |
| html-to-image          | Element/SVG to image conversion |
| jsPDF                  | PDF generation library          |
| Lucide React           | Icon library                    |

### Backend

| Technology           | Purpose           |
| -------------------- | ----------------- |
| Node.js 22           | Runtime           |
| Express (via Vercel) | API server        |
| Octokit 21           | GitHub API client |
| LRU Cache 11         | Response caching  |
| Google GenAI 2.6     | AI provider       |
| OpenAI 6             | AI provider       |
| Anthropic SDK 0.106  | AI provider       |

### Infrastructure

| Technology       | Purpose             |
| ---------------- | ------------------- |
| Google Cloud Run | Deployment platform |
| Docker           | Containerization    |
| Bun              | Package management  |
| Bun Test         | Testing framework   |
| ESLint 9         | Code quality        |

---

## 📖 Usage Guide

### 1. **Analyze a Repository**

```
Enter a GitHub URL → gitSdm fetches & parses → Interactive graph appears
```

### 2. **Explore Architecture**

```
Click nodes → View file contents → Trace dependencies → Understand modules
```

### 3. **Get AI Insights**

```
Select "Explain Architecture" → AI analyzes structure → Natural language summary
```

### 4. **Compare Branches**

```
Select branches → Visual diff → See architectural changes
```

---

## 🧪 Testing

```bash
# Run all tests
bun test

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

Tests are co-located with source files and use `*.test.ts` naming.

---

## 🗺️ Roadmap

### Planned Features

- [x] **AI-generated architecture diagrams** — High-quality Mermaid flowcharts detailing module boundaries and system workflows.
- [x] **Commit History & Activity** — Interactive timeline visualizing author patterns and directory churn over time.
- [x] **Export to PDF / PNG / SVG** — High-res canvas snapshots and vector diagram outputs for documentation.
- [x] **Private repository support** — Secure OAuth authentication and credential storage to map private codebases.
- [ ] **Monorepo-aware dependency grouping** — Automatic workspace detection (npm/pnpm/yarn) and cross-package mapping.
- [x] **AI-powered semantic search & Q&A** — Context-aware vector search to ask code questions and locate entry points. (Beta)
- [x] **Change impact analysis (Blast Radius)** — Visualizer showing transitive dependents to predict edit breakages.
- [ ] **CI/CD integration** — GitHub Action to automatically comment visual architecture diffs on PR updates.
- [ ] **Interactive path pruning & editing** — Tools to manually prune/group nodes and export tailored subgraphs.
- [ ] **Multi-repository mapping** — Cross-repo mapping to trace frontend-to-backend API and SDK dependencies.

---

## 🤝 Contributing

We welcome contributions! See our [contributing guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Ideas

- Improve graph rendering performance
- Add new AI providers
- Improve parser accuracy
- Create better onboarding flows
- Enhance repository analytics

---

## 🔒 Security

- API keys are never exposed to the client
- Environment variables are securely handled
- Rate limiting prevents abuse
- GitHub API access follows OAuth best practices

If you discover a vulnerability, please open a private security report.

---

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for more information.

---
