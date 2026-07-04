## 2023-11-09 - [O(N*M) Loop Optimization in Component Rendering]
**Learning:** Found nested loops inside the `OverviewTab` render cycle where `.find()` was being used inside a `.map()` to lookup nodes from a graph diff, turning it into an O(N*M) lookup.
**Action:** Always verify if `.find()` or `.filter()` inside loops can be hoisted or converted into an O(1) hash map or `Map` using `useMemo` when looking up state in lists.

## 2024-03-30 - Deferred Value for Tree Filtering
**Learning:** In highly nested or complex recursive component structures (like `SmartFileExplorer` which recursively filters a repository file tree), real-time filtering tied to user input blocks the main React rendering thread, leading to noticeable typing latency.
**Action:** Use React's `useDeferredValue` hook on the search input query. This allows React to process the keystroke updates synchronously while rendering the expensive filtered list at a lower priority, keeping UI interactions snappy.

## 2023-11-10 - [O(N*M) Loop Optimization in AnalysisTab]
**Learning:** Found nested loops inside the `AnalysisTab` render cycle where `.find()` was being used inside a `.map()` to lookup nodes from a graph diff, turning it into an O(N*M) lookup.
**Action:** Replaced `.find()` inside loops with an O(1) `Map` lookup using `useMemo` to create a `nodeById` map mapping node IDs to nodes. This is a recurring pattern in the visualization codebase.

## 2024-11-20 - [O(N*M) Loop Optimization in LearningPathTab]
**Learning:** Found nested loops inside the `LearningPathTab` render cycle event handlers (`onKeyDown`, `onClick`) where array `.find()` was being used inside a `.map()` to lookup target node IDs, turning it into an O(N*M) time complexity bottleneck for large codebases.
**Action:** Replaced `.find()` inside the `.map()` loop with an O(1) `Map` lookup by pre-computing a `nodeById` map mapping node IDs to node IDs using `useMemo` at the component level. This reinforces the pattern of using memoized Hash Maps for list lookups in React components.

## 2024-11-20 - [O(N) Lookups Optimization in Map/React state processing]
**Learning:** Found O(N) linear array lookups utilizing `.find()` inside the render blocks and hook dependencies where React components determine active `selectedNode`. Given graph datasets with potentially thousands of nodes, this blocks the main UI thread during renders.
**Action:** Replace `.find()` lookup inside render cycles / custom hooks with an O(1) `Map` generated using `useMemo` caching `n.id -> n`, retrieving nodes efficiently via `Map.get()`.

## 2024-11-20 - [O(N) Filter Optimization in AnalysisTab edge filtering]
**Learning:** Found O(N) linear array lookups utilizing `.filter()` multiple times directly inside the render cycle (e.g. `AnalysisTab` parsing `inEdges` and `outEdges`). Given graph datasets with potentially thousands of nodes, this runs `O(K * N)` filtering logic repeatedly during normal state renders.
**Action:** Replace multiple `.filter()` calls inside render cycles with a single pass using `useMemo` caching to efficiently group relations before mapping logic in the render, effectively shifting complexity back to a singular `O(N)` lookup.
## 2024-11-20 - [O(N) Iteration Optimization in buildDependencyHealthSummary]
**Learning:** Found multiple O(N) linear array lookups utilizing `.filter()` repeatedly to compute counts across categories inside the `buildDependencyHealthSummary` calculation logic.
**Action:** Replace multiple `.filter()` passes with a single `for` loop pass over the array utilizing a mutable tally counter struct, reducing iteration overhead and allocations to $O(N)$ exactly.
