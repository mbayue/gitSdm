# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-27

### Added
- First public release of `gitSdm`.
- Interactive dependency graph visualizer utilizing React Flow and Dagre.
- Support for parsing package manifests (`package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, `pyproject.toml`, `Dockerfile`, `pom.xml`).
- AI integration for repository health audit, roast, risk analysis, and README generation.
- Client-side code inspector dock with syntax highlighting.
- Contributor contributions map and commit history timeline charts.
- Local repository simulation mode with comprehensive mock datasets.

### Changed
- Refactored GitHub Actions workflow to run independent parallelized lint, typecheck, test, and build jobs.
- Improved TypeScript and ESLint type coverage across visualization hooks and search results.

### Fixed
- Fixed typescript compiler error in [GraphCanvas.tsx](file:///c:/Users/bayue/Documents/Code/gitSdm/src/features/graph/canvas/GraphCanvas.tsx) due to incorrect import path.
- Fixed timer instantiation issue in [useArchitectureExport.ts](file:///c:/Users/bayue/Documents/Code/gitSdm/src/components/viz/architecture/hooks/useArchitectureExport.ts) by providing proper `undefined` initial values to `useRef`.
- Fixed mock repository check tests failing in isolated test runner environments.
