# gitSdm

AI-powered GitHub repository visualization platform. Paste a public repo URL and explore an interactive dependency graph, architecture insights, file explorer, contributors, and commit timeline.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Framer Motion, React Flow
- **Backend:** Vercel serverless API routes or Node production server, Octokit, provider-agnostic AI (Gemini / OpenAI / Anthropic / mock)

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API routes are served via Vite middleware in development.

## Environment variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Optional. Increases GitHub API rate limits for public repos |
| `AI_PROVIDER` | `mock` (default), `gemini`,`openai`, or `anthropic` |
| `OPENAI_API_KEY` | Required when `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | Required when `AI_PROVIDER=anthropic` |
| `GEMINI_API_KEY` | Required when `AI_PROVIDER=gemini` |
| `GEMINI_MODEL` | Optional when `AI_PROVIDER=gemini`; defaults to `gemini-2.5-flash` |
| `GEMINI_API_VERSION` | Optional when `AI_PROVIDER=gemini`; defaults to `v1alpha` |

## Scripts

- `npm run dev` — start Vite dev server with API middleware
- `npm run build` — build the Vite frontend into `dist/`
- `npm run build:server` — build the Node production server into `dist-server/`
- `npm run build:docker` — build both frontend and production server
- `npm run start` — serve `dist/` and `/api/*` from the production Node server
- `npm run preview` — preview the frontend bundle only
- `npm test` — run unit tests (manifest parsers)

## Production with Docker

The Docker image builds the Vite app, bundles a small Node server, serves static files from `dist/`, and handles `/api/*` using the same API router as development/Vercel.

```bash
docker build -t gitsdm .
docker run --rm -p 3000:3000 --env-file .env gitsdm
```

Open [http://localhost:3000](http://localhost:3000).

For minimal setup, `GITHUB_TOKEN` is optional but recommended. AI features use `AI_PROVIDER=mock` by default; set the matching API key when using `gemini`, `openai`, or `anthropic`.

## Deploy (Vercel)

1. Push to GitHub and import in Vercel
2. Set environment variables in the project dashboard
3. Deploy — API routes in `/api` run as serverless functions

## Features

- Repository structure graph (folders, files, packages, contributors)
- Multi-ecosystem dependency parsing (npm, Python, Rust, Go, Docker, Java)
- AI: explain repo/node and/or architecture overview
- Smart file explorer with entry/config/test badges
- Contributor bar chart and 90-day commit timeline
- In-memory LRU cache (per serverless instance; best-effort on cold starts)

## Limits

- Public repositories only
- Tree capped at ~2000 files for serverless performance
- AI context limited to summaries and small snippets (never full repo)

## License

MIT
