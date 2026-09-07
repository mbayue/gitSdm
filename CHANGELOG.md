# Changelog

<!-- markdownlint-disable MD024 — duplicate subheadings per release are intentional -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-09-07

### Added

- **EdgeOne Makers Models Integration**: Support for EdgeOne AI gateway (`@makers/deepseek-v4-flash`).
- **D3 Tree Layout Overhauls**: D3 horizontal and vertical hierarchical tree layout with automated viewport refitting.
- **Offline Mock E2E Architecture**: Deterministic Playwright test suite driven by mock fixtures with zero external network dependencies.
- **Measured Toolbar Dropdown Clamping**: Dynamic positioning engine ensuring panels stay within canvas boundaries across all viewports.
- **Render Sequence Async Guard**: Monotonic render sequencing to eliminate race conditions in Mermaid diagram generation.

### Changed

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
