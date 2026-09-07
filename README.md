<!-- markdownlint-disable MD033 -->
<h1 align="center">gitSdm (Git Software Dependency Map v3.0.0)</h1>

<p align="center">
  <strong>Graph-first repository analysis for exploring files, dependencies, modules, architecture diagrams, and AI-powered codebase intelligence.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
  <a href="https://github.com/mbayue/gitSdm/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" /></a>
  <a href="https://github.com/mbayue/gitSdm/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mbayue/gitSdm/ci.yml?branch=master&style=for-the-badge&logo=github&label=CI" alt="CI" /></a>
  <a href="https://github.com/mbayue/gitSdm/issues"><img src="https://img.shields.io/github/issues/mbayue/gitSdm?style=for-the-badge&logo=github&label=Issues" alt="Issues" /></a>
</p>

---

## Features

- 🕸️ **Interactive Dependency Graph** — Canvas-accelerated force-directed and D3 tree layouts with node filtering (by scope, node type, content type, and focus layers).
- 🌡️ **Code Churn & Complexity Overlays** — Heatmap modes visualizing 90-day commit frequency, author ownership risk, and cyclomatic/line complexity.
- 🧠 **AI Codebase Intelligence** — Multi-provider AI orchestration for architecture overviews, dependency health audits, refactoring risk analysis, and interactive learning paths.
- 🔍 **Semantic Search & QA Engine** — Vector-embedded code chunking with natural language codebase question-answering.
- 📐 **Architecture Diagrams** — Automated Mermaid diagram generation with interactive zoom/pan and PNG/PDF/SVG export.
- 🔀 **Branch, Tag & Commit Comparison** — Visual diffing of dependencies and module trees across Git branches, tags, and specific commit SHAs.
- 👥 **Contributor Analytics & Timeline** — Commit history activity charts, timeline weeks, and author metrics.

---

## Quick Start

```bash
git clone https://github.com/mbayue/gitSdm.git
cd gitSdm
bun install
cp .env.example .env
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Prerequisites:** [Bun](https://bun.sh) >= 1.1, Node.js >= 22 (optional), and an optional GitHub Personal Access Token (`GITHUB_TOKEN`) for higher API rate limits.

---

## AI Providers

`gitSdm` unifies AI calls across providers with a fallback mock provider for full offline development:

| Provider | `AI_PROVIDER` | Configuration |
| --- | --- | --- |
| **Mock (Default)** | `mock` | No API key required. Uses offline fixtures. |
| **Google Gemini** | `gemini` | Set `GEMINI_API_KEY` (model: `gemini-2.5-flash`). |
| **OpenAI** | `openai` | Set `OPENAI_API_KEY` (model: `gpt-4o-mini`). |
| **Anthropic** | `anthropic` | Set `ANTHROPIC_API_KEY` (model: `claude-3-5-haiku-latest`). |
| **EdgeOne Makers** | `edgeone` | Set `EDGEONE_API_KEY` (model: `@makers/deepseek-v4-flash`). |

---

## Tech Stack

- **Runtime & Tooling:** Bun 1.3+, TypeScript 6, Vite 8
- **Frontend SPA:** React 19, Tailwind CSS 4, Zustand 5, TanStack Query 5, Framer Motion 12
- **Visualization:** `react-force-graph-2d`, `d3-force`, Mermaid 11, Recharts
- **Backend Server:** Express, Octokit REST v21, Zod validation, in-memory vector store

---

## Development & Testing

```bash
bun dev              # Start Vite dev server with embedded API
bun test             # Run test suite with Bun test runner
bun run typecheck    # TypeScript compiler check (app + node)
bun run lint         # ESLint flat config check
bun run build        # Production frontend bundle
bun run build:server # Build production Express server
bun run test:e2e     # Run Playwright end-to-end tests (mock mode)
```

---

## Documentation

| Document | Contents |
| --- | --- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Folder structure, service layers, and state flow |
| [`ROADMAP.md`](./ROADMAP.md) | Planned milestones and feature proposals |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Contribution guidelines, coding conventions, and PR guide |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release history and version updates |
| [`SECURITY.md`](./SECURITY.md) | Vulnerability disclosure policy |

---

## License

MIT. See [LICENSE](LICENSE).
