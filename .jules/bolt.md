## 2023-11-09 - [O(N*M) Loop Optimization in Component Rendering]
**Learning:** Found nested loops inside the `OverviewTab` render cycle where `.find()` was being used inside a `.map()` to lookup nodes from a graph diff, turning it into an O(N*M) lookup.
**Action:** Always verify if `.find()` or `.filter()` inside loops can be hoisted or converted into an O(1) hash map or `Map` using `useMemo` when looking up state in lists.

## 2024-03-30 - Deferred Value for Tree Filtering
**Learning:** In highly nested or complex recursive component structures (like `SmartFileExplorer` which recursively filters a repository file tree), real-time filtering tied to user input blocks the main React rendering thread, leading to noticeable typing latency.
**Action:** Use React's `useDeferredValue` hook on the search input query. This allows React to process the keystroke updates synchronously while rendering the expensive filtered list at a lower priority, keeping UI interactions snappy.

## 2023-11-10 - [O(N*M) Loop Optimization in AnalysisTab]
**Learning:** Found nested loops inside the `AnalysisTab` render cycle where `.find()` was being used inside a `.map()` to lookup nodes from a graph diff, turning it into an O(N*M) lookup.
**Action:** Replaced `.find()` inside loops with an O(1) `Map` lookup using `useMemo` to create a `nodeById` map mapping node IDs to nodes. This is a recurring pattern in the visualization codebase.
