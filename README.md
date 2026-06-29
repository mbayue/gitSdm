<!-- markdownlint-disable MD033 -->
<h1 align="center">gitSdm (Git Software Dependency Map v2.3.0)</h1>

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

## Quick Start

```bash
git clone https://github.com/mbayue/gitSdm.git
cd gitSdm
bun install
cp .env.example .env
bun dev
```

Prerequisites: **Bun >= 1.1**, **Node.js >= 22**, and a **GitHub token** (optional, increases API rate limits).

Set `AI_PROVIDER=mock` (default) or `gemini`/`openai`/`anthropic` with the matching API key in `.env`.

---

## More

| Document            | Contents                         |
| ------------------- | -------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Folder structure and module layout |
| [`ROADMAP.md`](./ROADMAP.md)           | Planned and proposed features     |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Dev workflow, testing, PR guide   |
| [`SECURITY.md`](./SECURITY.md)         | Vulnerability reporting           |

---

## License

MIT. See [LICENSE](LICENSE).
