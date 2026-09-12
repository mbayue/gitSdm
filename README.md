<!-- markdownlint-disable MD033 -->
<h1 align="center">gitSdm — Git Software Dependency Map</h1>

<p align="center">
  <strong>Interactive dependency maps for exploring files, modules, architecture diagrams, and codebase intelligence.</strong>
</p>

<p align="center">
  <a href="https://gsdm.site"><img src="https://img.shields.io/badge/Live-gsdm.site-blueviolet?style=for-the-badge" alt="Live Demo" /></a>
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

Search indexes are process-local and scoped to GitHub credentials, commit SHA, and embedding configuration. Use a persistent backend for search; indexes are not shared between serverless instances and are lost on restart. Per process, indexing allows two active jobs with no waiting queue. Each repository is limited to 2,000 supported files, 256 KiB per file, 4,000 chunks, and 32 MiB of estimated index data. Published indexes have a 128 MiB total budget, a 16-index cap, and a 30-minute lifetime, with least-recently-used eviction. Active builds retain at most 32 MiB each in addition to published indexes. Oversized or incomplete builds fail without replacing a published snapshot.

Embedding operations start at least `EMBEDDING_REQUEST_INTERVAL_MS` apart (default 1,000 ms per process). Provider rate limits return `429 EMBEDDING_RATE_LIMITED` immediately and pause new embedding work for the provider's `Retry-After` duration, or one minute when absent. Timeouts retry at most three attempts with bounded backoff. This pacing does not increase the provider's quota; full-repository indexing may still require a smaller scope or a higher provider quota.

Provider calls use separate AI and embedding queues, each allowing two active calls and eight waiting calls. Waiting expires after 10 seconds; active calls have a 30-second abort deadline. Operations that ignore cancellation retain their slot until they settle. GitHub requests time out after 15 seconds. AI prompts are capped at 64,000 characters with at most 4,096 output tokens. Mock providers do not spend the hosted-provider budget.

Repository analysis caches are scoped to the effective GitHub credential, including entries addressed by commit SHA. Repository access is checked before returning cached analysis. Raw credentials are never included in cache keys.

Set `TOKEN_CACHE_HASH_SECRET` to a securely generated random secret in shared mode, including when Redis configuration enables shared mode automatically. Use the same secret across instances. Local mode uses a random per-process secret when the setting is blank; restarting changes cache identities. Rotating a configured secret also changes those identities.

Usage controls combine per-IP counters with deployment-wide budgets. Each IP gets 120 expensive API requests per minute by default, including requests using user-provided credentials. Users on the same network may share this allowance. Configure these environment variables on the backend:

| Variable                                              | Default   | Meaning                                                                                                                                                                                     |
| ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_REQUESTS_PER_MINUTE`                             | `600`     | Shared expensive-route request budget; the per-process eight-active ceiling also applies.                                                                                    |
| `API_REQUESTS_PER_IP_PER_MINUTE`                      | `120`     | Per-client expensive-route budget, checked before global admission.                                                                                                                         |
| `TRUSTED_PROXY_IPS`                                   | unset     | Comma-separated exact proxy IP addresses allowed to supply `X-Forwarded-For`. The chain is checked from right to left, stopping at the first untrusted address.                             |
| `SERVER_AI_DAILY_CALLS`                               | `500`     | Server-funded completion attempts per UTC day; `0` requires user credentials. User-supplied AI keys still use the bounded queue and prompt limits.                                          |
| `SERVER_EMBEDDING_DAILY_BYTES`                        | `300000000` | Reserved UTF-8 input bytes per UTC day (300 MB), shared across server-funded embedding requests. Each attempt, including retries, reserves its input size before dispatch. Reservations remain counted if a later cooldown or timeout prevents dispatch; `0` disables paid embeddings. |
| `RATE_LIMIT_MODE`                                     | `local`   | Set to `shared` for multiple processes/instances.                                                                                                                                           |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | unset     | Redis REST connection for atomic shared reservations. Setting either also enables shared mode.                                                                                              |

Direct connections use the socket IP. Without trusted-proxy configuration, proxied users share the proxy's allowance; missing socket identities share an `unknown` bucket. Configure only proxies you control that append or replace the forwarded chain. Local limiter storage caps at 10,000 live counters and rejects new counters at capacity rather than evicting active quotas. IPv6 addresses are normalized but counted individually.


Shared mode fails closed when its backend is missing or unavailable. Local counters reset on restart and cannot impose a deployment-wide budget across multiple instances. Configure shared mode before scaling out. These are request/input limits, not a dollar spending cap; provider pricing varies. Reservations are not refunded after failures because upstream work may have been billed. The shared implementation uses the [Redis REST API](https://upstash.com/docs/redis/features/restapi) with atomic Lua reservations.

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

| Provider           | `AI_PROVIDER` | Configuration                                               |
| ------------------ | ------------- | ----------------------------------------------------------- |
| **Mock (Default)** | `mock`        | No API key required. Uses offline fixtures.                 |
| **Google Gemini**  | `gemini`      | Set `GEMINI_API_KEY` (model: `gemini-2.5-flash`).           |
| **OpenAI**         | `openai`      | Set `OPENAI_API_KEY` (model: `gpt-4o-mini`).                |
| **Anthropic**      | `anthropic`   | Set `ANTHROPIC_API_KEY` (model: `claude-3-5-haiku-latest`). |

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

| Document                               | Contents                                                  |
| -------------------------------------- | --------------------------------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Folder structure, service layers, and state flow          |
| [`ROADMAP.md`](./ROADMAP.md)           | Planned milestones and feature proposals                  |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Contribution guidelines, coding conventions, and PR guide |
| [`CHANGELOG.md`](./CHANGELOG.md)       | Release history and version updates                       |
| [`SECURITY.md`](./SECURITY.md)         | Vulnerability disclosure policy                           |

---

## License

MIT. See [LICENSE](LICENSE).

### Independent embedding configuration

Set `EMBEDDING_PROVIDER=openai`, `gemini`, or `mock` explicitly to keep semantic
search independent of `AI_PROVIDER`. Set `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`,
and (for OpenAI-compatible services) `EMBEDDING_API_BASE` independently of chat.
Gemini uses its SDK endpoint. Keep `EMBEDDING_DIMENSIONS` matched to the model.

Legacy OpenAI/Gemini key and embedding-model settings remain fallbacks. Without
`EMBEDDING_PROVIDER`, legacy selection still follows `AI_PROVIDER`. Configure all
embedding settings explicitly before changing chat credentials or endpoints.
Changing embedding model or endpoint invalidates existing search index identities.

### Browser chat settings

Settings accepts an AI API key, an explicit chat provider, an optional model,
and an optional OpenAI-compatible base URL. Save applies the fields together;
Clear removes the saved key and chat overrides. These settings apply to AI tasks
and Ask AI, not semantic indexing or embedding generation. Existing saved keys
remain supported.

Custom URLs require the user's own key and a public HTTPS endpoint. Local and private
network addresses are blocked, DNS addresses are checked and pinned for the connection,
and redirects are not followed. No server allowlist configuration is needed.
Requests use per-request configuration and cache identities include provider, model,
endpoint, and hashed credentials.
