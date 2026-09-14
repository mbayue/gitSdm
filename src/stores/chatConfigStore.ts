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

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || chatStorageKeys.includes(event.key)) refreshChatConfig();
  });
}
