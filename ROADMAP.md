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

### 📸 Commit & Tag Snapshot Diffing (Compare Branch Extension)

Extend the existing Compare Branch feature — which already diffs two branches with full graph overlay (colored rings, edge coloring, Added/Modified/Deleted counts) — to also accept **commit SHAs and tags** as comparison targets, not just branch names.

**What's already built** (in Compare Branch):
- `useVizDiff` hook: SHA-based tree diff → added/modified/deleted sets
- Full graph overlay: colored node rings + colored edges on the force canvas
- OverviewTab: Added/Modified/Deleted counts + clickable file lists
- Per-node diff badge in AnalysisTab
- Filter by diff status (show only added, only deleted, etc.)

**What's net-new** (the actual work):
- Commit/tag picker UI alongside the existing branch picker — e.g. a timeline scrubber, tag dropdown, or "compare to N days ago" shortcut
- Verify `/api/repo/analyze` handles commit SHA refs (GitHub API accepts SHAs in the same `ref` param — likely near-zero backend change)
- "Time travel" framing in the UI: label the comparison as "main → v2.1.0" or "main → abc1234"

**Why**: The existing Compare Branch answers "what's different between two live branches." Extending it to commits/tags answers "how did this architecture evolve over time?" — a different question with the same rendering engine.

**Effort**: Low-Medium — ~70% of the work is already done. New effort is the picker UI and ref validation.

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

### 2. � Code Churn + Hotspot Heatmap

Overlay git blame data on the force graph — color nodes by commit frequency, recency, and number of distinct authors. Hotspots (frequently changed, many authors) are classic stability risks.

- Node color intensity reflects churn score (commits in last N days)
- Node border highlights files touched by 3+ distinct authors
- Tooltip shows churn rank, top contributors, and last-modified date
- Filter panel: "show only files changed in last 30 days"

**Why**: The commit timeline already exists. Adding churn as a graph signal is a short hop that surfaces actionable refactoring targets without requiring AI. Engineers immediately see "this file is touched by everyone and changed constantly — it's a problem."

**Effort**: Low-Medium — git history is already parsed for the timeline. New work is computing a churn score per file and mapping it to node visual properties.

---

### 3. �🚦 Dependency Rule Engine (Live Architecture Linter)

Let teams define custom architecture rules:

- `src/features/*` must not import from `src/components/ui/*`
- `server/` must not import from `src/`
- No circular dependencies between modules A and B

Violations are **highlighted on the graph** in real-time and can surface as a PR check via a lightweight API endpoint.

**Why**: Turns gitSdm from a read-only viewer into a daily governance tool that enforces architecture as the codebase evolves.

**Effort**: Medium — dependency graph already exists. New work is a rule DSL + violation overlay on ReactFlow + optional PR check endpoint.

---

### 4. 📊 Complexity Score per Module

Compute a complexity signal per node: LOC + import count + export count + cyclomatic depth estimate. Show it as node size or color saturation.

- No AI required — purely graph-derived metrics
- Sidebar panel ranks files by complexity score
- Overlay toggle: "color by complexity" vs. "color by churn" vs. default
- Pairs naturally with the Hotspot Heatmap for a full health picture

**Why**: Gives engineers a fast "where should I refactor?" answer without any external tooling. Complexity + churn together form a classic maintenance risk matrix.

**Effort**: Low — purely additive computation on top of the existing parsed graph. No backend routes needed, no AI calls.

---

### 5. 💬 Inline AI Annotations in Code Inspector

When a user clicks a file node, offer contextual AI actions directly in the inspector dock:

- "Explain this file" — summarize the module's role in plain language
- "Why does this file have N dependents?" — trace and explain the dependency chain
- "Suggest a refactor" — AI-driven recommendation based on complexity + churn signals

**Why**: The AI provider layer, semantic search, and code inspector dock all exist. This is mostly wiring existing pieces together into a tighter loop. Reduces context switching — instead of opening the AI sidebar separately, insight appears where you're already looking.

**Effort**: Low-Medium — new UI affordances in the inspector dock + reusing existing AI task handlers.

---

### 6. 🔔 Dependency Drift Alerts (Scheduled CI Report)

A lightweight GitHub Action / webhook that runs the health report on a schedule and posts a comment or issue when:

- A dependency goes outdated by N major versions
- A new license incompatibility appears
- A circular dependency is introduced
- Churn hotspots exceed a configurable threshold

**Why**: Extends the existing health panel into the CI pipeline without a UI overhaul. Teams get proactive alerts instead of only discovering issues when they open gitSdm manually.

**Effort**: Low-Medium — health report logic already exists. New work is a GitHub Action wrapper + configurable threshold rules + comment/issue posting via Octokit (already a dependency).

---

### 7. 🔮 "What If?" Refactoring Simulator

Drag a node from one module to another on the graph and see in real-time:

- All import paths that would break (overlaid in red)
- A diff of every file that needs to change
- Effort estimate (# files × # imports affected)
- Optionally generate a refactoring plan or codemod

**Why**: Turns gitSdm into a planning tool teams use *before* writing code, not just a visualization of what already exists.

**Effort**: Medium — depends on existing dependency graph and parser. The heavy lift is the reverse-dependency cascade (recomputing which imports break when a file moves).

---

### 8. 🔗 Multi-Repository Mapping

Cross-repo dependency tracing: stitch graphs from multiple repositories into a single unified view.

- Link packages across repos (e.g. frontend → shared UI library → backend SDK)
- Detect API contracts between services (shared proto files, OpenAPI specs, message queue topics)
- Unified search and dependency chain across org boundaries

**Why**: Microservice architectures spread across 10+ repos. Engineers constantly ask "if I change this API in service A, which repos consume it?" gitSdm can't answer that today.

**Effort**: XL — requires choosing a discovery mechanism, building a cross-repo resolver, redesigning the graph data model, and reworking the frontend for multi-repo navigation. High risk, high reward.
