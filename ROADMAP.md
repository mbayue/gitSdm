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
- **Personalized Onboarding Paths** — AI-generated custom reading tours. User pastes a repo URL + describes their goal, and the system returns a guided walkthrough ("start with these 5 files, in this order") with graph node highlights. Implemented as `LearningPathTab`.
- **Commit & Tag Snapshot Diffing** — Extended Compare Branch to accept commit SHAs and tags as comparison targets. Includes Branches/Tags/SHA sub-tabs in the picker UI, `/api/repo/tags` endpoint, and full graph overlay for any ref type.

---

## Up Next

### 1. Interactive Path Pruning & Editing

Tools to manually prune, regroup, and export tailored subgraphs from the visualization:

- Click to select/deselect nodes on the @xyflow/react canvas
- Delete or group selected nodes with live re-layout (force-directed or dagre)
- "Focus on selection" — zoom to and isolate a subgraph, hiding everything else
- Export the pruned subgraph as PNG, SVG, or standalone JSON

**Why**: Users today get the full repo graph or nothing. For large codebases, being able to carve out a focused subgraph (e.g. "just the auth module + its dependencies") and export it for docs or presentation is a natural next step.

**Effort**: Medium — pure frontend work on the existing ReactFlow canvas. No backend changes.

---

### 2. Code Churn + Hotspot Heatmap

Overlay git blame data on the force graph — color nodes by commit frequency, recency, and number of distinct authors. Hotspots (frequently changed, many authors) are classic stability risks.

- Node color intensity reflects churn score (commits in last N days)
- Node border highlights files touched by 3+ distinct authors
- Tooltip shows churn rank, top contributors, and last-modified date
- Filter panel: "show only files changed in last 30 days"

**Why**: The commit timeline already exists. Adding churn as a graph signal is a short hop that surfaces actionable refactoring targets without requiring AI. Engineers immediately see "this file is touched by everyone and changed constantly — it's a problem."

**Effort**: Low-Medium — git history is already parsed for the timeline. New work is computing a churn score per file and mapping it to node visual properties.

---

### 3. Complexity Score per Module

Compute a complexity signal per node: LOC + import count + export count + cyclomatic depth estimate. Show it as node size or color saturation.

- No AI required — purely graph-derived metrics
- Sidebar panel ranks files by complexity score
- Overlay toggle: "color by complexity" vs. "color by churn" vs. default
- Pairs naturally with the Hotspot Heatmap for a full health picture

**Why**: Gives engineers a fast "where should I refactor?" answer without any external tooling. Complexity + churn together form a classic maintenance risk matrix.

**Effort**: Low — purely additive computation on top of the existing parsed graph. No backend routes needed, no AI calls.

---

### 4. Inline AI Annotations in Code Inspector

When a user clicks a file node, offer contextual AI actions directly in the inspector dock:

- "Explain this file" — summarize the module's role in plain language
- "Why does this file have N dependents?" — trace and explain the dependency chain
- "Suggest a refactor" — AI-driven recommendation based on complexity + churn signals

**Why**: The AI provider layer, semantic search, and code inspector dock all exist. This is mostly wiring existing pieces together into a tighter loop. Reduces context switching — instead of opening the AI sidebar separately, insight appears where you're already looking.

**Effort**: Low-Medium — new UI affordances in the inspector dock + reusing existing AI task handlers.

---

### 5. Dependency Drift Alerts (Scheduled CI Report)

A lightweight GitHub Action / webhook that runs the health report on a schedule and posts a comment or issue when:

- A dependency goes outdated by N major versions
- A new license incompatibility appears
- A circular dependency is introduced
- Churn hotspots exceed a configurable threshold

**Why**: Extends the existing health panel into the CI pipeline without a UI overhaul. Teams get proactive alerts instead of only discovering issues when they open gitSdm manually.

**Effort**: Low-Medium — health report logic already exists. New work is a GitHub Action wrapper + configurable threshold rules + comment/issue posting via Octokit (already a dependency).

---

### 6. Dependency Cycle Visualizer

Detect and highlight circular import paths directly on the force graph — animated red edges for cycles, side panel listing cycles grouped by length.

- Standard DFS cycle detection against the existing import edges (zero backend changes)
- Animated red edge rendering for nodes participating in a cycle
- Side panel: list of cycles with affected files, sorted by cycle length (shortest first)
- Click a cycle entry → focus the graph on the participating nodes
- Filter toggle: "show cycles only" — hide non-participating nodes

**Why**: Circular dependencies are a real maintenance smell that's hard to spot in a dense graph. Surfacing them visually with animation makes them impossible to ignore. The data is already there — this is pure client-side graph algorithm work.

**Effort**: Low — ~200 lines. Cycle detection is textbook DFS on existing edges (no backend changes). Edge animation and side panel reuse existing patterns (Blast Radius for the UI, animated edges from the graph renderer).

---
