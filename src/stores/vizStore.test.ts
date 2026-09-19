import { describe, expect, it } from 'bun:test';

// bun test has no Web Storage, and the store snapshots localStorage at import
// time, so the stub must be installed before the module under test is imported.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  get length(): number {
    return this.map.size;
  }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });

const { useVizStore } = await import('./vizStore');

describe('closePanelsPreservingMode', () => {
  it('closes both panels in one update without rewriting the saved workspaceMode', () => {
    const store = useVizStore.getState();
    store.setWorkspaceMode('full');
    expect(useVizStore.getState().explorerOpen).toBe(true);
    expect(useVizStore.getState().aiSidebarOpen).toBe(true);

    useVizStore.getState().closePanelsPreservingMode();

    const state = useVizStore.getState();
    expect(state.explorerOpen).toBe(false);
    expect(state.aiSidebarOpen).toBe(false);
    expect(state.workspaceMode).toBe('full');
  });

  it('restores both panels when the preserved mode is reapplied (desktop return)', () => {
    useVizStore.getState().setWorkspaceMode('full');
    useVizStore.getState().closePanelsPreservingMode();

    const saved = useVizStore.getState().workspaceMode;
    useVizStore.getState().setWorkspaceMode(saved);

    const state = useVizStore.getState();
    expect(state.workspaceMode).toBe('full');
    expect(state.explorerOpen).toBe(true);
  });
});
