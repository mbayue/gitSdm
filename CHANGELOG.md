# Changelog

<!-- markdownlint-disable MD024 — duplicate subheadings per release are intentional -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
