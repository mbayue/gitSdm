# gitSdm Roadmap

## Completed

- **AI-generated architecture diagrams** — Mermaid flowcharts detailing module boundaries and system workflows.
- **Commit History & Activity** — Interactive timeline visualizing author patterns and directory churn over time.
- **Export to PDF / PNG / SVG** — Graph maps export to PNG/PDF, while Mermaid architecture diagrams export to SVG/PNG for documentation.
- **Private repository support** — GitHub PAT-based access for private codebases while OAuth support remains planned.
- **Monorepo-aware dependency grouping** — Automatic workspace detection (npm/pnpm/yarn/bun) and cross-package mapping.
- **AI-powered semantic search & Q&A** — Context-aware vector search to ask code questions and locate entry points.
- **Change impact analysis (Blast Radius)** — Visualizer showing transitive dependents to predict edit breakages.
- **Dependency Health Report** — Core health panel, version freshness checker (npm), license compliance audits, and real-time visual highlight alerts (amber borders/warning badges) on the force-directed canvas.
- **Code Churn & Hotspot Overlays** — Visual overlay for 90-day commit frequency, author ownership risk (3+ distinct authors), and LRU-cached churn service.
- **Complexity Score per Module** — Graph-derived complexity metrics (LOC, import count, export count) with Color/Size by Complexity modes.
- **Unified Multi-Provider AI** — Support for Gemini, OpenAI, Anthropic, EdgeOne Makers, and an offline Mock provider.
- **Personalized Onboarding Paths** — AI-generated custom reading tours. User pastes a repo URL + describes their goal, and the system returns a guided walkthrough ("start with these 5 files, in this order") with graph node highlights. Implemented as `LearningPathTab`.
- **Commit & Tag Snapshot Diffing** — Extended Compare Branch to accept commit SHAs and tags as comparison targets. Includes Branches/Tags/SHA sub-tabs in the picker UI, `/api/repo/tags` endpoint, and full graph overlay for any ref type.

---

## Up Next

### 1. Interactive Path Pruning & Subgraph Isolation

Tools to manually prune, regroup, and export tailored subgraphs from the visualization:

- Click to select/deselect nodes on the canvas
- Group or isolate selected nodes with live re-layout (force-directed or D3 tree)
- "Focus on selection" — zoom to and isolate a subgraph, hiding everything else
- Export the pruned subgraph as PNG, SVG, or standalone JSON

**Why**: Users today get the full repo graph or nothing. For large codebases, being able to carve out a focused subgraph (e.g. "just the auth module + its dependencies") and export it for docs or presentation is a natural next step.

**Effort**: Medium — frontend enhancements on top of the force graph canvas. No backend changes.

---

### 2. Inline AI Annotations in Code Inspector

When a user clicks a file node, offer contextual AI actions directly in the inspector dock:

- "Explain this file" — summarize the module's role in plain language
- "Why does this file have N dependents?" — trace and explain the dependency chain
- "Suggest a refactor" — AI-driven recommendation based on complexity + churn signals

**Why**: The AI provider layer, semantic search, and code inspector dock all exist. This is mostly wiring existing pieces together into a tighter loop. Reduces context switching — instead of opening the AI sidebar separately, insight appears where you're already looking.

**Effort**: Low-Medium — new UI affordances in the inspector dock + reusing existing AI task handlers.

---

### 3. Dependency Drift Alerts (Scheduled CI Report)

A lightweight GitHub Action / webhook that runs the health report on a schedule and posts a comment or issue when:

- A dependency goes outdated by N major versions
- A new license incompatibility appears
- A circular dependency is introduced
- Churn hotspots exceed a configurable threshold

**Why**: Extends the existing health panel into the CI pipeline without a UI overhaul. Teams get proactive alerts instead of only discovering issues when they open gitSdm manually.

**Effort**: Low-Medium — health report logic already exists. New work is a GitHub Action wrapper + configurable threshold rules + comment/issue posting via Octokit (already a dependency).

---

### 4. "What If?" Refactoring Simulator

Drag a node from one module to another on the graph and see in real-time:

- All import paths that would break (overlaid in red)
- A diff of every file that needs to change
- Effort estimate (# files x # imports affected)
- Optionally generate a refactoring plan or codemod

**Why**: Turns gitSdm into a planning tool teams use *before* writing code, not just a visualization of what already exists.

**Effort**: Medium — depends on existing dependency graph and parser. The heavy lift is the reverse-dependency cascade (recomputing which imports break when a file moves).

---

### 5. Multi-Repository Mapping

Cross-repo dependency tracing: stitch graphs from multiple repositories into a single unified view.

- Link packages across repos (e.g. frontend → shared UI library → backend SDK)
- Detect API contracts between services (shared proto files, OpenAPI specs, message queue topics)
- Unified search and dependency chain across org boundaries

**Why**: Microservice architectures spread across 10+ repos. Engineers constantly ask "if I change this API in service A, which repos consume it?" gitSdm can't answer that today.

**Effort**: XL — requires choosing a discovery mechanism, building a cross-repo resolver, redesigning the graph data model, and reworking the frontend for multi-repo navigation. High risk, high reward.
