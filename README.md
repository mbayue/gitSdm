<h1 align="center">gitSdm<sup>β</sup> (Git Software Dependency Map Beta v0.9.0)</h1>

<p align="center">
  <strong>AI-Powered Repository Intelligence & Architecture Visualization Platform</strong>
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
  <a href="https://github.com/bayue48/gitSdm/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" /></a>
  <a href="https://github.com/bayue48/gitSdm/actions"><img src="https://img.shields.io/badge/Build-Passing-success?style=for-the-badge" alt="Build" /></a>
</p>

---

<p align="center">
  <img src="assets/graph.png" alt="Repository Graph" width="75%" />
</p>

---

## ✨ Overview

**gitSdm** transforms how developers understand unfamiliar codebases. Instead of spending hours reading through files and tracing dependencies, gitSdm provides **instant, interactive architecture visualization** powered by AI.

> *"The kind of deep insight that normally takes days of reading code — delivered in seconds."*

### 🎯 Value Proposition

| Problem | Solution |
|---------|----------|
| 🕒 Hours spent onboarding to new repos | ⚡ Instant architecture overview |
| 🔍 Manual dependency tracing | 🕸️ Interactive dependency graph |
| 📚 Scattered documentation | 🤖 AI-generated code explanations |
| 🧩 Unclear module boundaries | 🎯 Visual file classification |

---

## 🏗️ Architecture

```
gitSdm/
├── 📁 api/                    # Vercel serverless functions
│   ├── ai/                    # AI endpoints (architecture, explain, suggest)
│   ├── repo/                  # Repository data endpoints
│   └── trending.ts            # Trending repositories
├── 📁 server/                 # Backend services
│   ├── ai/                    # AI provider & prompt management
│   ├── cache/                 # LRU caching layer
│   ├── github/                # GitHub API integration
│   ├── graph/                 # Graph building & layout algorithms
│   ├── parser/                # Dependency & file analysis
│   ├── services/              # Business logic layer
│   └── utils/                 # HTTP, logging utilities
├── 📁 src/                    # Frontend application
│   ├── app/                   # App providers & routing
│   ├── components/            # UI components
│   │   ├── contributors/      # Contributor analytics
│   │   ├── explorer/          # File explorer & code inspector
│   │   ├── home/              # Landing page components
│   │   ├── layout/            # Navigation & layout
│   │   ├── theme/             # Theme synchronization
│   │   ├── timeline/          # Repository timeline
│   │   ├── ui/                # Reusable UI primitives
│   │   └── viz/               # Visualization components
│   ├── features/              # Feature modules
│   │   ├── ai/                # AI integration hooks
│   │   └── graph/             # Graph rendering engine
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & API client
│   ├── pages/                 # Route pages
│   ├── stores/                # State management
│   ├── styles/                # Global styles
│   └── types/                 # TypeScript definitions
├── 📁 public/                 # Static assets
├── 📁 assets/                 # Screenshots & media
└── 📁 .agents/                # AI agent configurations
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22 (Alpine)
- **pnpm** ≥ 9 (recommended) or npm/yarn
- **GitHub Personal Access Token** (for API access)

### Installation

```bash
# Clone the repository
git clone https://github.com/bayue48/gitSdm.git
cd gitSdm

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Environment Configuration

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Optional. Increases GitHub API rate limits for public repos |
| `AI_PROVIDER` | `mock` (default), `gemini`,`openai`, or `anthropic` |
| `OPENAI_API_KEY` | Required when `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | Required when `AI_PROVIDER=anthropic` |
| `GEMINI_API_KEY` | Required when `AI_PROVIDER=gemini` |
| `GEMINI_MODEL` | Optional when `AI_PROVIDER=gemini`; defaults to `gemini-1.5-flash` |
| `GEMINI_API_VERSION` | Optional when `AI_PROVIDER=gemini`; defaults to `v1alpha` |
| `OPENAI_MODEL` | Optional when `AI_PROVIDER=openai`; defaults to `gpt-4o-mini` |
| `ANTHROPIC_MODEL` | Optional when `AI_PROVIDER=anthropic`; defaults to `claude-3-5-haiku-latest` |

### Development

```bash
# Start development server (frontend + backend)
pnpm dev

# Or run separately:
pnpm dev:frontend  # Vite dev server on :5173
pnpm dev:backend   # Express dev server on :3001
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
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
- **Mermaid diagram** export for documentation

### 📊 **Repository Intelligence**
- **Contributor analytics** with `recharts` visualizations
- **Commit timeline** and activity patterns
- **Trending repositories** discovery
- **File explorer** with syntax highlighting via `highlight.js`

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript 5.8 | Type safety |
| Vite 6 | Build tooling |
| @xyflow/react 12 | Graph visualization |
| Framer Motion 12 | Animations |
| TanStack React Query 5 | Data fetching |
| Tailwind CSS 3.4 | Styling |
| Recharts 2 | Charts & analytics |
| Mermaid 11 | Diagram generation |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 22 | Runtime |
| Express (via Vercel) | API server |
| Octokit 21 | GitHub API client |
| LRU Cache 11 | Response caching |
| Google GenAI 2.6 | AI provider |
| OpenAI 4 | AI provider |
| Anthropic SDK 0.39 | AI provider |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Google Cloud Run | Deployment platform |
| Docker | Containerization |
| pnpm | Package management |
| Vitest | Testing framework |
| ESLint 9 | Code quality |

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
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

Test files are co-located with source files:
- `server/parser/manifest-parsers/index.test.ts`
- `server/github/parse-url.test.ts`
- `server/graph/graph-builder.test.ts`
- `server/graph/layout.test.ts`
- `server/parser/dependency-analyzer.test.ts`
- `server/parser/file-classifier.test.ts`

---

## 🗺️ Roadmap

### Planned Features

- [x] AI-generated architecture diagrams
- [x] Commit History
- [ ] Private repository support
- [ ] Export to PDF / PNG
- [ ] Monorepo-aware dependency grouping

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