## Plan: Commit & Tag Snapshot Diffing

**Status**: In Progress (Task 0–4 completed)  
**Scope**: Extension of the existing Compare Branch feature  
**Effort**: Low-Medium (rendering engine already built)

---

## Context

The Compare Branch feature is already fully implemented:
- `useVizDiff` computes added/modified/deleted by comparing file SHAs between two refs
- Force graph paints colored rings on nodes and colors edges by diff status
- OverviewTab shows counts + clickable file lists
- `diffStatusFilters` lets users filter the graph by diff type

The backend (`/api/repo/analyze`) accepts `branch: string` with no regex restriction — it passes whatever ref string straight to the GitHub API, which accepts branch names, commit SHAs, and tags identically.

**The gap**: the UI only exposes a branch name picker. There is no way to compare against a commit SHA or tag.

---

## What We're Building

A **ref picker** that extends `BranchSwitcher` to also accept commits and tags in compare mode. Everything downstream reuses the existing diff pipeline unchanged.

---

## Tasks

### ✅ Task 0 — Fix `fetchRepoInfo` to accept any ref (blocker)

**File**: `server/github/fetch-tree.ts`

**Problem**: `fetchRepoInfo` currently resolves the commit SHA via `octokit.repos.getBranch`, which only accepts branch names. Passing a tag name or commit SHA returns a GitHub 404, which the current catch block silently swallows by falling back to the default branch. Comparing against `v1.0.0` or `abc1234` would silently compare against `main` instead.

**Fix**: Replace the `getBranch` call with `octokit.repos.getCommit`, which accepts any ref — branch name, tag, or full/short SHA.

```ts
// Before (branch-only):
const { data: branch } = await octokit.repos.getBranch({
  owner,
  repo,
  branch: targetBranch,
});
const sha = branch.commit.sha;

// After (any ref):
const { data: commit } = await octokit.repos.getCommit({
  owner,
  repo,
  ref: targetBranch,
});
const sha = commit.sha;
```

The returned `sha` is used identically downstream — `fetchFlatTree`, `fetchFileContents`, and the cache key all receive the resolved SHA, so nothing else changes.

Keep the existing 404 fallback to default branch — it's still valid behavior when a user passes a ref that genuinely doesn't exist.

---

### ✅ Task 1 — Fetch tags from GitHub API

**File**: `server/router/repo-routes.ts` + `src/lib/apiClient.ts`

Add a new route `GET /api/repo/tags` that calls `fetchRepoTags(owner, repo)` and returns `{ name: string; sha: string }[]`.

The GitHub API endpoint is:
```
GET /repos/{owner}/{repo}/tags
```
Returns up to 30 tags (most recent first) by default — enough for the initial UI.

Also add `fetchRepoTags(owner, repo)` to `apiClient.ts` and a `useRepoTags(owner, repo)` hook alongside `useRepoBranches`.

---

### ✅ Task 2 — Extend vizStore

**File**: `src/stores/vizStore.ts`

Add `compareRefType: 'branch' | 'tag' | 'commit'` to state (default `'branch'`).  
Add `setCompareRefType(type)` setter.

This is used only for labeling in the UI — the diff pipeline doesn't need to know the type.

---

### ✅ Task 3 — Extend BranchSwitcher with a Ref Picker

**File**: `src/components/viz/top-nav/BranchSwitcher.tsx`

In Compare Mode, add a segmented toggle above the search input:

```
[ Branches ]  [ Tags ]  [ Commit SHA ]
```

- **Branches** tab: existing behavior unchanged
- **Tags** tab: fetches from `useRepoTags`, renders same `BranchItem` list style
- **Commit SHA** tab: shows a plain text input, validates it looks like a SHA (7–40 hex chars) or a partial ref. On confirm (Enter or a button click), calls `setCompareBranch(sha)` + `setCompareRefType('commit')`

When a tag or commit is selected, update the compare pill label to show context:
- Tag: `main → v2.1.0` with a tag icon
- Commit: `main → abc1234` (truncated to 7 chars) with a commit icon

---

### ✅ Task 4 — Update Compare Pill Label

**File**: `src/components/viz/top-nav/BranchSwitcher.tsx`

The existing pill shows `activeBranch → compareBranch`. When `compareRefType` is `'tag'`, prefix with a tag icon. When `'commit'`, truncate the SHA to 7 chars and show a commit icon. Branch stays as-is.

---

### 🟡 Task 5 — Smoke Test

Manually verify:
1. Compare two branches — existing behavior unchanged
2. Compare `main` vs a tag (e.g. `v1.0.0`) — graph diff renders correctly
3. Compare `main` vs a full commit SHA — graph diff renders correctly
4. Compare `main` vs a 7-char short SHA — graph diff renders correctly
5. Invalid SHA input (non-hex, too short) shows inline validation error, does not call the API

---

## What We Are NOT Changing

| Concern | Reason |
|---|---|
| `useVizDiff` hook | No changes — SHA tree diffing works for any ref |
| `forcePainter` / node rings | No changes |
| Edge coloring in `forceGraphUtils` | No changes |
| OverviewTab diff summary | No changes |
| `diffStatusFilters` | No changes |
| `analyzeBodySchema` | `branch: z.string().optional()` already accepts any ref |
| Backend `analyzeRepository` | Passes ref to GitHub API as-is — already works |

---

## File Touch List

| File | Status |
|---|---|
| `server/github/fetch-tree.ts` | ✅ Task 0: Replace `getBranch` with `getCommit` + add `fetchRepoTags` |
| `server/router/repo-routes.ts` | ✅ Add `GET /api/repo/tags` handler |
| `src/lib/apiClient.ts` | ✅ Add `fetchRepoTags()` client function |
| `src/hooks/useRepoTags.ts` | ✅ New hook created |
| `src/stores/vizStore.ts` | ✅ Add `compareRefType` state + setter |
| `src/components/viz/top-nav/BranchSwitcher.tsx` | ✅ Add Branches/Tags/Commit tabs + pill label update |

**7 files touched. 1 new file (`useRepoTags.ts`).**

**Build verified:** `bun run build` passes.
