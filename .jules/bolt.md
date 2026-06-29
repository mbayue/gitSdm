## 2026-06-28 - [O(N^2) Loop Optimization in JSX Render Block]
**Learning:** In the timeline render inside `src/components/viz/OverviewTab.tsx`, an `Math.max(...array.map(...))` was originally embedded directly within another `.map()` iterator without scoping, recalculating the exact same graph data repeatedly (O(N^2)). Using IIFEs within the JSX block allows us to calculate shared array aggregations ONCE outside the iteration without breaking the declarative JSX tree structure.
**Action:** When finding map operations inside React render blocks, extract aggregation functions or computations affecting the entire array scope outside of the mapping iteration, utilizing either `useMemo` or an IIFE pattern to calculate it once.

## 2023-11-09 - [O(N*M) Loop Optimization in Component Rendering]
**Learning:** Found nested loops inside the `OverviewTab` render cycle where `.find()` was being used inside a `.map()` to lookup nodes from a graph diff, turning it into an O(N*M) lookup.
**Action:** Always verify if `.find()` or `.filter()` inside loops can be hoisted or converted into an O(1) hash map or `Map` using `useMemo` when looking up state in lists.
