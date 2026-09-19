import { create } from 'zustand';

const chatStorageKeys = [
  'gitsdm_gemini_api_key',
  'gitsdm_github_pat',
  'gitsdm_ai_provider',
  'gitsdm_ai_model',
  'gitsdm_ai_base_url',
];

function readSettings(): string {
  try {
    return JSON.stringify(chatStorageKeys.map((key) => localStorage.getItem(key)));
  } catch {
    return '';
  }
}

// Credentials stay out of observable state and cache keys.
let savedSettings = readSettings();
export const useChatConfigRevision = create(() => ({ revision: 0 }));

export function refreshChatConfig() {
  const next = readSettings();
  if (next === savedSettings) return;
  savedSettings = next;
  useChatConfigRevision.setState((state) => ({ revision: state.revision + 1 }));
}

// Tracked writer for credential/AI settings. The 'storage' event only fires in
// OTHER tabs, so same-tab writers must go through here to notify subscribers
// (credential-scoped query keys, AI task caches) without a reload.
export function writeChatConfigItem(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  refreshChatConfig();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || chatStorageKeys.includes(event.key)) refreshChatConfig();
  });
}
