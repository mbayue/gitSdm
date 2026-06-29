# Security Policy

We take the security of `gitSdm` seriously. If you find a vulnerability, report it privately — do not open a public issue.

---

## Supported Versions

Security updates are actively applied to the latest major release branch.

| Version | Supported          |
| ------- | ------------------ |
| v1.x    | :white_check_mark: |
| < v1.0  | :x:                |

---

## Scope

### In Scope

The following components are in scope for security vulnerability reports:

* Core parsing logic under [server/parser/](server/parser/) and [server/github/](server/github/).
* API endpoints defined in [server/prod-server.ts](server/prod-server.ts) and server routers.
* Token and secret leakage via environment variables or logs.
* Client-side Cross-Site Scripting (XSS) in markdown or graph visualizers.

### Out of Scope

* Attacks requiring physical access to the user's host machine.
* Issues related to third-party dependencies (unless a wrapper vulnerability exists in `gitSdm` itself). Please report dependency bugs to their respective maintainers.
* Rate-limiting issues on the mock API endpoints.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a vulnerability, please report it privately:

1. **GitHub Security Advisory:** Submit a report via the "Security" tab on GitHub (preferred).
2. **Email:** Send a detailed report to `rich.bayue@gmail.com`.

Please include the following details in your report:

* A description of the vulnerability and its potential impact.
* Step-by-step instructions to reproduce the behavior.
* A minimal Proof of Concept (PoC) if applicable.
* Any proposed mitigations or fixes.

---

## Response Timeline

We prioritize security reports:

* **Acknowledgment:** within 72 hours
* **Assessment & fix:** timeline depends on severity and complexity — we'll keep you updated

---

## Disclosure Policy

We practice coordinated disclosure. Give us reasonable time to investigate and release a fix before making details public. After a patched version is published, we'll coordinate disclosure and credit you.

---

## Safe Harbor

Research conducted in good faith under this policy is authorized:

* We will not pursue legal action against you.
* We will not report you to law enforcement.
* If a third party pursues action against you, we'll make it known your research complied with this policy.

---

## Security Best Practices for Users

* **Environment Variables:** Never check in your `GITHUB_TOKEN`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY` into git repositories. Use the local `.env` file (which is gitignored).
* **Private Repositories:** Ensure access tokens passed to `gitSdm` use the minimum necessary scopes (ideally read-only permissions for repository metadata/trees).
* **Docker Deployments:** When running via Docker, bind the server to `127.0.0.1` unless external access is explicitly required, and configure a reverse proxy with TLS.
