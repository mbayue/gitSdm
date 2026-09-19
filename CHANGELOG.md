# Changelog

<!-- markdownlint-disable MD024 — duplicate subheadings per release are intentional -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to progressive [Semantic Versioning](https://semver.org/spec/v2.0.0.html) based on commit scope and size:

- **Major (`+1.x.x`)**: Major architectural rewrite or large-scale overhaul (100+ files).
- **Minor (`x.+1.x`)**: Feature additions and substantial enhancements (`feat`).
- **Patch (`x.x.+1`)**: Bug fixes, security hardening, and maintenance (`fix`, `chore`).

Releases on the same date are consolidated under that date's latest version.

## [3.5.11] - 2026-09-14

### Follow-up fixes (2026-09-19)

- Pin embedding connections to validated public addresses, with a bounded body limit that accommodates JSON escaping.
- Avoid replaying shared quota reservations after an ambiguous transport failure.
- Normalize equivalent mapped IPv6 addresses and count each commit author once.
- Keep paused indexing attached to its repository and original scope; show safe error messages.
- Generate and cache AI architecture diagrams against the displayed commit SHA.

### Security

- **DNS-Pinned Limiter Requests**: The shared usage limiter now connects only to DNS-validated addresses over `node:https` with the original TLS identity (no re-resolution between validation and connect), so a rebinding hostname cannot divert the Redis bearer token to a private address; redirects fail closed and responses are capped at 64 KiB.
- **Bounded Outbound Request Bodies**: Custom-endpoint chat requests stream through a running-total size check (256 KiB, plus `Content-Length` pre-check) instead of buffering unbounded `arrayBuffer()` calls.
- **HTTPS-Only Embedding Endpoints**: Configured `OPENAI_API_BASE`/`EMBEDDING_API_BASE` values are rejected before constructing the embedding client when they are not HTTPS.
- **Client Quota Canonicalization & Secrecy**: IPv4-mapped forwarded addresses canonicalize from their 32-bit payload (hex forms included) so per-IP buckets cannot be evaded, and client scopes derive from a server-secret HMAC instead of unkeyed SHA-256.
- **Non-Negative Usage Amounts**: `reserveUsage` rejects negative and non-integer amounts before either backend path, closing quota replenishment.
- **Strict IPv6 Compression & Group Validation in SSRF Guard**: Enforces non-zero `::` compression runs (`missing > 0`) and validates each group as 1–4 hexadecimal characters before parsing in `url-guard.ts`, failing closed on malformed zero-run compressions and out-of-range hextets.

### Fixed

- **Repository-Scoped Index Operations**: Active indexing operations track owner/repo and reset on repository navigation; query resets bump the mutation revision while preserving the in-flight index build; stale search/ask responses drop on revision, scope, branch, or repo mismatch.
- **Resumable Index State Preservation**: `INDEX_NOT_FOUND` after scope edits and cross-repository status polls no longer hide `indexing`/`paused` operations; retries preserve snapshot and coverage only when resuming a paused build.
- **Indexing Error Sanitization**: Untrusted API error messages are stripped of URLs, tokens, and paths (300-char cap) before display, and pipeline logs use secret-safe error payloads; embedding cooldowns arm only on provider 429s.
- **Credential-Scoped Caches & Churn**: Churn and health query keys carry the credential revision; continuations echo an opaque scope fingerprint and refetch on mismatch; per-file 404s no longer halt whole-batch polling; author counts include both login and commit author names.
- **Tracked Same-Tab Config Writes**: All credential/AI setting writes route through a helper that refreshes chat config (including `VizError` PAT clears); tool cache keys use presence-safe branch encoding and Mermaid requests share the keyed task cache.
- **Dependency-Focused Health Path**: Cold `/api/repo/health` requests skip the full analysis pipeline (no contributors, timeline, commits, or graph), and npm metadata is fetched for every dependency with no 100-item truncation.
- **Responsive Workspace Preservation**: Mobile panel closing and repository switches use a single mode-preserving state update; the Settings popover re-reads stored values on open across desktop/mobile instances.
- **Parser, Queue & HTTP Fixes**: PEP 621 scans stay within `[project]` (optionals only in `[project.optional-dependencies]`), versionless Poetry path/git/URL tables emit with undefined versions, aborted queue entries skip work, stalled bodies return typed 408s, caller abort signals reach providers, and `.git` suffixes strip before query/hash parsing.
- **Test Seams Over Module Mocks**: `analyze-repo` and `get-file` suites drive the real pipeline through stub Octokit clients in `RequestContext` instead of `mock.module()` on shared internal modules; admission tests use an injectable pinned-POST seam.
- **Frontend/Server Type Boundary**: Shared `SearchCoverage`, `IndexingStatus`, `scopeKey`, and `coverageMessage` live in `src/` (types via the barrel, pure helpers via `@/lib`), ending all deep `server/` imports from the frontend; server runtime keeps a documented local mirror where project boundaries forbid sharing.
- **Dev Server 404 & Asset Parity**: Aligned Vite development middleware with production Express server by serving 404 HTML for unmapped client routes and JSON 404 for missing `/assets/*` paths.
- **Mock Repository AI Fallback**: Ensured mock repository owners use deterministic offline fixtures in `executeAiTask` when no user API key is configured.
- **AI Mutation Revision Invalidation**: Tagged AI task mutations with active configuration revisions and validated revision matches in `useAiCenterState`, preventing stale results from blocking fresh requests on settings updates.
- **Canvas Redraw on Metadata Updates**: Linked graph metadata updates directly to `drawNodeCanvasObject` in `ForceGraphCanvas`, repainting updated node metrics immediately without reheating simulation physics.
- **Explicit Timeout Retry Matching**: Replaced ambiguous regex with explicit `/(?:timeout|timed\s*out)/i` in `embedding-retry.ts`.

## [3.5.7] - 2026-09-13

### Security

- **Full IPv6 Expansion in SSRF Guard**: IPv6 hostnames expand to their complete eight-group form before transition-prefix decoding, so compressed zero runs can no longer shift embedded IPv4 fields (`2002::802:808` no longer decodes as a public host).
- **Strict Well-Known NAT64 Decoding**: Only `64:ff9b::/96` with zero mid-groups decodes its embedded IPv4; the local-use variant `64:ff9b:1::/48` and all other `64:ff9b::*` forms reject outright.
- **Bounded Limiter DNS Resolution**: The shared limiter's DNS lookup is bounded by an injectable deadline (default 3s) and fails closed on timeout, so a hung resolver cannot hold admission slots.
- **Limiter DNS Resolution Validation**: The shared limiter resolves its hostname and re-validates every resolved address through the SSRF guard before connecting, fails closed on lookup failure or non-public addresses, rejects redirects so the bearer token cannot be forwarded, and supports IPv6-literal limiter URLs.
- **SSRF Guard Transition Prefixes**: The URL guard decodes embedded IPv4 destinations in NAT64 (`64:ff9b::/96`) and 6to4 (`2002::/16`) addresses and rejects private/loopback destinations, rejects the `64:ff9b:1::/48` local-use variant and `192.0.0.0/24`.
- **SSRF Guard for Outbound Fetches**: Added `server/utils/url-guard.ts` rejecting non-http(s) schemes and loopback/private/reserved hosts (IPv6 `::/8` and multicast forms, documentation and TEST-NET ranges, bare single-label names) and applied it to the shared rate limiter's Upstash fetch with distinct not-configured/not-permitted errors.
- **Rate-Limit Budget Protection**: Unknown `/api/*` paths now return 404 before any admission or usage bucket is reserved, so unregistered-path floods can no longer exhaust the deployment-wide budget.
- **PAT-Scoped AI Caches**: Included `gitsdm_github_pat` in chat config revisions (refreshed on save/clear) and reset AI panel mutations when the commit/revision changes, preventing cache reuse across credential changes.
- **Quota & Endpoint Security**: Prevented quota bypass from whitespace keys, enabled DNS multi-address sequential fallbacks, clamped `Retry-After` cooldown conversions, and combined caller signals with embedding queues.

### Fixed

- **Unified Search Scope Typing**: Scope polling, the search store, and indexing mutations now share the canonical `IndexScope` contract instead of three structural copies.
- **Search Scope Changes During Indexing**: Editing include/exclude filters while an index builds clears stale results and coverage while the operation keeps running, and status polling keeps targeting the build's original scope until it settles.
- **Bounded Queue Listener Leak & Abort Observability**: Detached caller-abort listener when the deadline rejects a never-settling job, and attached active abort listener during execution in `createBoundedQueue` so cancelled jobs immediately vacate waiting slots and abort running work.
- **413 Body Teardown**: Oversized request bodies now flush the response and destroy the socket instead of draining indefinitely.
- **Embedding Timeout Classification**: Matched the OpenAI SDK's "Request timed out." message so client timeouts receive backoff retries.
- **Search Scope Path Validation**: Rejected only whole `..` path components in include/exclude filters, allowing directory names like `a..b.ts`.
- **Search Scope Reset Guard**: Editing include/exclude fields no longer abandons an active or paused indexing operation; new `search-page-logic` helpers cover payloads, branch resolution, and partial-coverage enablement.
- **Graph Metadata Refresh & Simulation Stability**: `reconcileGraph` preserves simulation data identity on metric-only updates to prevent unintended reheating, while updating node visual properties.
- **Status Query Recovery**: Restored bounded retries for the indexing status query so transient failures don't hide existing indexes.
- **Reduced Motion Defaults**: OS-level reduced motion is honored before hydration and whenever no explicit choice is stored, while explicit Full/Reduced selections still win.
- **Churn Error Message & Retry Ordering**: Collapsed duplicate churn failure notices into one message and aligned server failure retry calculation with client (`a.retryAt - b.retryAt`).
- **Custom Endpoint Hardening & Validation Feedback**: Restricted custom endpoint retries strictly to pre-transmission connection failures, prevented retries on size-limit or redirect rejections, and wired real-time validation and error alerts in `SettingsPopover`.
- **Mobile Drawer Exclusivity**: Ensured `setExplorerOpen` and `setAiSidebarOpen` keep drawers mutually exclusive on mobile viewports.
- **Manifest Parser Depth**: Handled standard PEP 621 `dependencies = [...]` arrays, bracketed extras, PEP 508 environment markers, optional dependencies (`[project.optional-dependencies]`), Poetry dev groups (`type: 'dev'`), and ignored brackets inside TOML comments in `pip-parser`.
- **Commit Invalidation & AI Tool Cache**: Included repository commit SHA in tool cache keys, reset active mutations when commit SHA advances in `useAiCenterState`, and added bounded LRU eviction (100 entries).
- **UI & Layout Sync**: Kept `workspaceMode` in sync with individual panel toggles, gated health enrichment on comparison branches, and validated repository naming in navigation.

## [3.5.0] - 2026-09-12

### Added

- **Custom OpenAI-Compatible Endpoints**: Support for user-defined OpenAI-compatible base URLs and model overrides in Settings.
- **SSRF Protection for Custom Endpoints**: Blocks private, loopback, and link-local IP addresses with pinned DNS resolution.
- **Independent Embedding Configuration**: Decouples `EMBEDDING_PROVIDER`, `EMBEDDING_API_KEY`, `EMBEDDING_API_BASE`, and `EMBEDDING_MODEL` from chat settings.
- **Task Lifecycle Resilience**: Unified in-memory promise caching in `src/features/ai/tool-cache.ts` ensuring in-flight requests survive tab remounts and branch switches.

### Changed

- **Unified AI Providers**: Streamlined provider interface across Gemini, OpenAI, Anthropic, and Mock. Consolidated EdgeOne into standard OpenAI-compatible configuration.
- **Client Cache Synchronization**: Settings updates increment a chat configuration revision that invalidates stale cached responses and refreshes active tools.

### Fixed

- **Workspace Modes**: Made workspace modes mutually exclusive: Explorer Only opens only the file explorer, Insights Only opens only repository insights, and Focus Mode closes both panels, with desktop and mobile regression tests.

## [3.0.2] - 2026-09-08

### Fixed

- **Cache Endpoint Security**: Eliminated unauthenticated `/api/cache/clear` endpoint.
- **Mermaid Code Splitting**: Code-split `mermaid` library to dedicated vendor chunk, shrinking `ArchitectureView` from 1.44 MB to 22 KB.
- **Performance & Asset Caching**: Removed font-gating FOIT blocker in `index.html`, enabled `display=swap`, and added immutable Cache-Control headers for hashed static assets across Bun server, Vercel, and EdgeOne.
- **SEO & Metadata**: Added search engine metadata: `robots.txt`, `sitemap.xml`, OpenGraph SVG banner, and social meta tags.
- Replaced marketing buzzword copy across documentation and landing pages.

## [3.0.0] - 2026-09-07

### Added

- **EdgeOne Makers Models Integration**: Support for EdgeOne AI gateway (`@makers/deepseek-v4-flash`).
- **D3 Tree Layout Overhauls**: D3 horizontal and vertical hierarchical tree layout with automated viewport refitting.
- **Offline Mock E2E Architecture**: Deterministic Playwright test suite driven by mock fixtures with zero external network dependencies.
- **Measured Toolbar Dropdown Clamping**: Dynamic positioning engine ensuring panels stay within canvas boundaries across all viewports.
- **Render Sequence Async Guard**: Monotonic render sequencing to eliminate race conditions in Mermaid diagram generation.

### Changed

- Comprehensive homepage and repository workspace refresh across 110 files.
- Sandboxed homepage sample graph from global state mutations.
- Enhanced accessibility across UI components (`role="status"`, `role="alert"`, `aria-current`, and focus management).
- Upgraded project metadata, documentation, and versioning to 3.0.0.

## [2.8.0] - 2026-07-03

### Added

- **Code Churn & Complexity Overlays**: Visual overlay for 90-day commit frequency, author ownership risk (3+ distinct authors), and cyclomatic/line complexity with LRU-cached churn service.
- **Compare Mode Extension**: Added support for comparing tags and specific commit SHAs in the visual workspace.
- **AI Playground**: Dedicated interface for testing AI prompts and logic directly within the app.
- **Dependency Health Highlights**: Real-time visual alerts and health status mapping for project dependencies.
- Unified color architecture with `GRAPH_NODE_PALETTES` and `GRAPH_NODE_LAYER_OFFSETS`.
- Legend panel with churn/complexity ramp and blast radius section.
- Mobile-responsive layout improvements for the home and visualization pages.

### Changed

- **AI Provider Unification**: Refactored the core AI logic to use a unified provider flow across Gemini, OpenAI, and Anthropic.
- Purged unused React Flow dependencies in favor of optimized canvas-based rendering for large graphs.
- Color architecture refactored for strict visual lane separation (fill/ring/glow/badge).
- Optimized O(N) array lookups to O(1) Map lookups in several critical UI components (LearningPathTab, AnalysisTab).

### Fixed

- **Sentinel (HIGH)**: Fixed XSS vulnerability in the SyntaxHighlighter component.
- **Sentinel (MEDIUM)**: Fixed information disclosure in server-side error handling.
- Fixed logic bugs in the `BranchSwitcher` component.

## [2.3.0] - 2026-06-30

### Added

- Monorepo workspace manifest analysis — automatic detection of npm, pnpm, yarn, and bun workspaces with cross-package dependency mapping.

### Changed

- Removed dead code across frontend and server modules.
- Optimized OverviewTab node lookup to O(1).
- Added accessibility labels to Navbar and UI controls.
- Updated environment configuration examples.
- Refreshed README metadata, badges, and homepage footer links.
- Hid README graph image for cleaner layout.

### Fixed

- Fixed CodeQL false positive heuristic in CI pipeline.
- Fixed path traversal vulnerability in static file server.
- Fixed security audit warnings.

## [1.0.0] - 2026-06-27

### Added

- First public release of `gitSdm`.
- Interactive dependency graph visualizer utilizing React Flow and Dagre.
- Support for parsing package manifests (`package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, `pyproject.toml`, `Dockerfile`, `pom.xml`).
- AI integration for repository health audit, roast, risk analysis, and README generation.
- Client-side code inspector dock with syntax highlighting.
- Contributor map and commit history timeline charts.
- Local repository simulation mode with mock datasets.

### Changed

- Refactored GitHub Actions workflow to run parallel lint, typecheck, test, and build jobs.
- Improved TypeScript and ESLint type coverage across visualization hooks and search results.

### Fixed

- Fixed typescript compiler error in [GraphCanvas.tsx](src/features/graph/canvas/GraphCanvas.tsx) due to incorrect import path.
- Fixed timer instantiation issue in [useArchitectureExport.ts](src/components/viz/architecture/hooks/useArchitectureExport.ts) by providing `undefined` initial values to `useRef`.
- Fixed mock repository check tests failing in isolated test runner environments.
