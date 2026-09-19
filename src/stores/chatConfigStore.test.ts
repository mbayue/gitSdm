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

const { refreshChatConfig, useChatConfigRevision, writeChatConfigItem } = await import('./chatConfigStore');

const revision = () => useChatConfigRevision.getState().revision;

describe('chatConfigStore revision inputs', () => {
  it('bumps the revision when the GitHub PAT is saved, but not when nothing changed', () => {
    const before = revision();

    localStorage.setItem('gitsdm_github_pat', 'ghp_test_token');
    refreshChatConfig();
    expect(revision()).toBe(before + 1);

    refreshChatConfig();
    expect(revision()).toBe(before + 1);
  });

  it('bumps the revision when the GitHub PAT is cleared', () => {
    const before = revision();

    localStorage.removeItem('gitsdm_github_pat');
    refreshChatConfig();
    expect(revision()).toBe(before + 1);
  });

  it('bumps the revision when an AI setting changes', () => {
    const before = revision();

    localStorage.setItem('gitsdm_ai_model', 'test-model');
    refreshChatConfig();
    expect(revision()).toBe(before + 1);
  });

  it('bumps the revision through the tracked same-tab writer, but not when the value is unchanged', () => {
    const before = revision();

    writeChatConfigItem('gitsdm_github_pat', 'ghp_same_tab_token');
    expect(revision()).toBe(before + 1);

    writeChatConfigItem('gitsdm_github_pat', 'ghp_same_tab_token');
    expect(revision()).toBe(before + 1);

    writeChatConfigItem('gitsdm_github_pat', null);
    expect(revision()).toBe(before + 2);
    expect(localStorage.getItem('gitsdm_github_pat')).toBeNull();
  });
});
