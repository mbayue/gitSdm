# 🗺️ gitSdm Roadmap

## ✅ Completed

- **AI-generated architecture diagrams** — Mermaid flowcharts detailing module boundaries and system workflows.
- **Commit History & Activity** — Interactive timeline visualizing author patterns and directory churn over time.
- **Export to PDF / PNG / SVG** — Graph maps export to PNG/PDF, while Mermaid architecture diagrams export to SVG/PNG for documentation.
- **Private repository support** — GitHub PAT-based access for private codebases while OAuth support remains planned.
- **Monorepo-aware dependency grouping** — Automatic workspace detection (npm/pnpm/yarn/bun) and cross-package mapping.
- **AI-powered semantic search & Q&A** — Context-aware vector search to ask code questions and locate entry points.
- **Change impact analysis (Blast Radius)** — Visualizer showing transitive dependents to predict edit breakages.
- **📦 Dependency Health Report** — Core health panel, version freshness checker (npm), license compliance audits, and real-time visual highlight alerts (amber borders/warning badges) on the force-directed canvas.
- **🧭 Personalized Onboarding Paths** — AI-generated custom reading tours. User pastes a repo URL + describes their goal, and the system returns a guided walkthrough ("start with these 5 files, in this order") with graph node highlights. Implemented as `LearningPathTab`.

---

## 🚧 In Progress

- *(None)*

---

## 📋 Up Next

### 1. ✂️ Interactive Path Pruning & Editing

Tools to manually prune, regroup, and export tailored subgraphs from the visualization:

- Click to select/deselect nodes on the @xyflow/react canvas
- Delete or group selected nodes with live re-layout (force-directed or dagre)
- "Focus on selection" — zoom to and isolate a subgraph, hiding everything else
- Export the pruned subgraph as PNG, SVG, or standalone JSON

**Why**: Users today get the full repo graph or nothing. For large codebases, being able to carve out a focused subgraph (e.g. "just the auth module + its dependencies") and export it for docs or presentation is a natural next step.

**Effort**: Medium — pure frontend work on the existing ReactFlow canvas. No backend changes.

---

### 2. 🚦 Dependency Rule Engine (Live Architecture Linter)

Let teams define custom architecture rules:

- `src/features/*` must not import from `src/components/ui/*`
- `server/` must not import from `src/`
- No circular dependencies between modules A and B

Violations are **highlighted on the graph** in real-time and can surface as a PR check via a lightweight API endpoint.

**Why**: Turns gitSdm from a read-only viewer into a daily governance tool that enforces architecture as the codebase evolves.

**Effort**: Medium — dependency graph already exists. New work is a rule DSL + violation overlay on ReactFlow + optional PR check endpoint.

---

### 3. 🔮 "What If?" Refactoring Simulator

Drag a node from one module to another on the graph and see in real-time:

- All import paths that would break (overlaid in red)
- A diff of every file that needs to change
- Effort estimate (# files × # imports affected)
- Optionally generate a refactoring plan or codemod

**Why**: Turns gitSdm into a planning tool teams use *before* writing code, not just a visualization of what already exists.

**Effort**: Medium — depends on existing dependency graph and parser. The heavy lift is the reverse-dependency cascade (recomputing which imports break when a file moves).

---

### 4. 🔗 Multi-Repository Mapping

Cross-repo dependency tracing: stitch graphs from multiple repositories into a single unified view.

- Link packages across repos (e.g. frontend → shared UI library → backend SDK)
- Detect API contracts between services (shared proto files, OpenAPI specs, message queue topics)
- Unified search and dependency chain across org boundaries

**Why**: Microservice architectures spread across 10+ repos. Engineers constantly ask "if I change this API in service A, which repos consume it?" gitSdm can't answer that today.

**Effort**: XL — requires choosing a discovery mechanism, building a cross-repo resolver, redesigning the graph data model, and reworking the frontend for multi-repo navigation. High risk, high reward.
