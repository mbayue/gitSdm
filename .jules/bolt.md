## 2024-03-30 - Deferred Value for Tree Filtering
**Learning:** In highly nested or complex recursive component structures (like `SmartFileExplorer` which recursively filters a repository file tree), real-time filtering tied to user input blocks the main React rendering thread, leading to noticeable typing latency.
**Action:** Use React's `useDeferredValue` hook on the search input query. This allows React to process the keystroke updates synchronously while rendering the expensive filtered list at a lower priority, keeping UI interactions snappy.
