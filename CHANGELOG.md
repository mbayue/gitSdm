# Changelog

<!-- markdownlint-disable MD024 — duplicate subheadings per release are intentional -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to progressive [Semantic Versioning](https://semver.org/spec/v2.0.0.html) based on commit scope and size:

- **Major (`+1.x.x`)**: Major architectural rewrite or large-scale overhaul (100+ files).
- **Minor (`x.+1.x`)**: Feature additions and substantial enhancements (`feat`).
- **Patch (`x.x.+1`)**: Bug fixes, security hardening, and maintenance (`fix`, `chore`).

## [3.5.8] - 2026-09-14

### Security

- **Strict IPv6 Compression & Group Validation in SSRF Guard**: Enforces non-zero `::` compression runs (`missing > 0`) and validates each group as 1–4 hexadecimal characters before parsing in `url-guard.ts`, failing closed on malformed zero-run compressions and out-of-range hextets.

## [3.5.7] - 2026-09-13

### Security

- **Full IPv6 Expansion in SSRF Guard**: IPv6 hostnames expand to their complete eight-group form before transition-prefix decoding, so compressed zero runs can no longer shift embedded IPv4 fields (`2002::802:808` no longer decodes as a public host).
- **Strict Well-Known NAT64 Decoding**: Only `64:ff9b::/96` with zero mid-groups decodes its embedded IPv4; the local-use variant `64:ff9b:1::/48` and all other `64:ff9b::*` forms reject outright.
- **Bounded Limiter DNS Resolution**: The shared limiter's DNS lookup is bounded by an injectable deadline (default 3s) and fails closed on timeout, so a hung resolver cannot hold admission slots.

### Fixed

- **Unified Search Scope Typing**: Scope polling, the search store, and indexing mutations now share the canonical `IndexScope` contract instead of three structural copies.

## [3.5.6] - 2026-09-13

### Security

- **Limiter DNS Resolution Validation**: The shared limiter resolves its hostname and re-validates every resolved address through the SSRF guard before connecting, fails closed on lookup failure or non-public addresses, rejects redirects so the bearer token cannot be forwarded, and supports IPv6-literal limiter URLs.
- **SSRF Guard Transition Prefixes**: The URL guard decodes embedded IPv4 destinations in NAT64 (`64:ff9b::/96`) and 6to4 (`2002::/16`) addresses and rejects private/loopback destinations, rejects the `64:ff9b:1::/48` local-use variant and `192.0.0.0/24`, and pins the precision with tests.

### Fixed

- **Search Scope Changes During Indexing**: Editing include/exclude filters while an index builds clears stale results and coverage while the operation keeps running, and status polling keeps targeting the build's original scope until it settles.

## [3.5.5] - 2026-09-13

### Security

- **SSRF Guard for Outbound Fetches**: Added `server/utils/url-guard.ts` rejecting non-http(s) schemes and loopback/private/reserved hosts (IPv6 `::/8` and multicast forms, documentation and TEST-NET ranges, bare single-label names) and applied it to the shared rate limiter's Upstash fetch with distinct not-configured/not-permitted errors.
- **Rate-Limit Budget Protection**: Unknown `/api/*` paths now return 404 before any admission or usage bucket is reserved, so unregistered-path floods can no longer exhaust the deployment-wide budget.
- **PAT-Scoped AI Caches**: Included `gitsdm_github_pat` in chat config revisions (refreshed on save/clear) and reset AI panel mutations when the commit/revision changes, preventing cache reuse across credential changes.

### Fixed

- **Bounded Queue Listener Leak**: Detached the caller-abort listener when the deadline rejects a never-settling job, ending signal-lifetime listener retention.
- **413 Body Teardown**: Oversized request bodies now flush the response and destroy the socket instead of draining indefinitely.
- **Embedding Timeout Classification**: Matched the OpenAI SDK's "Request timed out." message so client timeouts receive backoff retries.
- **Search Scope Path Validation**: Rejected only whole `..` path components in include/exclude filters, allowing directory names like `a..b.ts`.
- **Search Scope Reset Guard**: Editing include/exclude fields no longer abandons an active or paused indexing operation; new `search-page-logic` helpers cover payloads, branch resolution, and partial-coverage enablement.
- **Graph Metadata Refresh**: `reconcileGraph` returns a new graph data wrapper (same node references, coordinates preserved) so churn/complexity overlays update without re-simulation.
- **Status Query Recovery**: Restored bounded retries for the indexing status query so transient failures don't hide existing indexes.
- **Reduced Motion Defaults**: OS-level reduced motion is honored before hydration and whenever no explicit choice is stored, while explicit Full/Reduced selections still win.
- **Churn Error Message**: Collapsed the duplicated churn failure message into one coherent notice.

## [3.5.4] - 2026-09-13

### Fixed

- **Active Queue Job Abort Observability**: Attached active abort listener to `callerSignal` during execution in `createBoundedQueue`, ensuring caller cancellation immediately aborts running work and rejects promptly without waiting for the timeout deadline.

## [3.5.3] - 2026-09-13

### Fixed

- **Simulation & Canvas Stability**: Preserved data identity in `reconcileGraph` for metric-only updates to prevent unintended simulation reheating and reduced-motion overlays.
- **Queue Abort Observability**: Added caller signal tracking to `createBoundedQueue` so cancelled jobs immediately vacate waiting slots.
- **Custom Endpoint Hardening**: Restricted custom endpoint retries strictly to pre-transmission connection failures and prevented retries on size-limit or redirect rejections.
- **Mobile Drawer Exclusivity**: Ensured `setExplorerOpen` and `setAiSidebarOpen` keep drawers mutually exclusive on mobile viewports.
- **Settings Validation Feedback**: Wired real-time validation and error alert displays for custom models and base URLs in `SettingsPopover`.
- **Manifest Parser Depth**: Ignored brackets inside comments in TOML arrays and parsed inline dotted-key optional dependency tables in `pip-parser`.
- **Commit Invalidation**: Reset active mutations when repository commit SHA advances in `useAiCenterState`.

## [3.5.2] - 2026-09-13

### Fixed

- **Search & Scope Stability**: Preserved active indexing operations when path filters change, cleared stale coverage on mutation error, and encoded status query path scopes unambiguously.
- **AI Tool Cache & Resource Bounds**: Included repository commit SHA in tool cache keys and added bounded LRU eviction.
- **Manifest Parser Improvements**: Handled PEP 508 environment markers, extras brackets, PEP 621 optional dependencies, and Poetry dev groups.
- **Security & Limits**: Prevented quota bypass from whitespace keys, enabled DNS multi-address sequential fallbacks, clamped `Retry-After` cooldown conversions, and combined caller signals with embedding queues.
- **UI & Layout Sync**: Kept `workspaceMode` in sync with individual panel toggles, gated health enrichment on comparison branches, validated custom endpoints/models before saving, and provided distinct graph container identities on metadata updates.

## [3.5.1] - 2026-09-13

### Fixed

- **PEP 621 & Poetry Manifest Parsing**: Added support for standard PEP 621 `dependencies = [...]` arrays and Poetry `[tool.poetry.dependencies]` tables in `pyproject.toml`.

## [3.5.0] - 2026-09-12

### Added

- **Custom OpenAI-Compatible Endpoints**: Support for user-defined OpenAI-compatible base URLs and model overrides in Settings.
- **SSRF Protection for Custom Endpoints**: Blocks private, loopback, and link-local IP addresses with pinned DNS resolution.
- **Independent Embedding Configuration**: Decouples `EMBEDDING_PROVIDER`, `EMBEDDING_API_KEY`, `EMBEDDING_API_BASE`, and `EMBEDDING_MODEL` from chat settings.
- **Task Lifecycle Resilience**: Unified in-memory promise caching in `src/features/ai/tool-cache.ts` ensuring in-flight requests survive tab remounts and branch switches.

### Changed

- **Unified AI Providers**: Streamlined provider interface across Gemini, OpenAI, Anthropic, and Mock. Consolidated EdgeOne into standard OpenAI-compatible configuration.
- **Client Cache Synchronization**: Settings updates increment a chat configuration revision that invalidates stale cached responses and refreshes active tools.

## [3.0.2] - 2026-09-08

### Fixed

- Made workspace modes mutually exclusive: Explorer Only opens only the file explorer, Insights Only opens only repository insights, and Focus Mode closes both panels.
- Added browser regression coverage for desktop and mobile workspace-mode panel visibility.

## [3.0.1] - 2026-09-08

### Fixed

- Eliminated unauthenticated `/api/cache/clear` endpoint.
- Code-split `mermaid` library to dedicated vendor chunk, shrinking `ArchitectureView` from 1.44 MB to 22 KB.
- Removed font-gating FOIT blocker in `index.html` and enabled `display=swap`.
- Added immutable Cache-Control headers for hashed static assets across Bun server, Vercel, and EdgeOne.
- Added search engine metadata: `robots.txt`, `sitemap.xml`, OpenGraph SVG banner, and social meta tags.
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

- Code Churn overlay (Color by Churn mode) with LRU-cached churn service
- Complexity Score overlay (Color by Complexity / Size by Complexity)
- Unified color architecture with `GRAPH_NODE_PALETTES` and `GRAPH_NODE_LAYER_OFFSETS`
- Legend panel with churn/complexity ramp and blast radius section
- Churn cache bucket in LRU cache (200 max, 1hr TTL)

### Changed

- Color architecture refactored for strict visual lane separation (fill/ring/glow/badge)
- Multi-author ring visibility gated at zoom ≥ 0.75
- Compare-branch modified color: amber (#f59e0b)
- Churn/complexity low end: `#3f3f46` → `#ffffff`
- Legend swatches unified to circles

## [2.7.5] - 2026-07-03

### Added

- **Compare Mode Extension**: Added support for comparing tags and specific commit SHAs in the visual workspace.
- **AI Playground**: New dedicated interface for testing AI prompts and logic directly within the app.
- **Dependency Health Highlights**: Real-time visual alerts and health status mapping for project dependencies.
- Mobile-responsive layout improvements for the home and visualization pages.

### Changed

- **AI Provider Unification**: Refactored the core AI logic to use a unified provider flow, improving reliability across Gemini, OpenAI, and Anthropic.
- Purged unused React Flow dependencies in favor of optimized canvas-based rendering for large graphs.
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
