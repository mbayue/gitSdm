import { create } from 'zustand';
import type { SearchResultCard, QAAnswer, IndexingStatus } from '@/types';

export type SearchMode = 'search' | 'ask';

interface SearchState {
  mode: SearchMode;
  query: string;
  results: SearchResultCard[];
  answer: QAAnswer | null;
  isLoading: boolean;
  error: string | null;
  recentQueries: string[];
  indexingStatus: IndexingStatus;
  askCache: Map<string, QAAnswer>;
  searchCache: Map<string, SearchResultCard[]>;

  setMode: (mode: SearchMode) => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResultCard[]) => void;
  setAnswer: (answer: QAAnswer | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIndexingStatus: (status: IndexingStatus) => void;
  addRecentQuery: (query: string) => void;
  reset: () => void;
}

const SESSION_KEY = 'gitsdm_search_recent';
const MAX_RECENT = 10;

function loadRecentQueries(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentQueries(queries: string[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(queries));
  } catch {
    // sessionStorage unavailable
  }
}

export const useSearchStore = create<SearchState>((set, get) => ({
  mode: 'search',
  query: '',
  results: [],
  answer: null,
  isLoading: false,
  error: null,
  recentQueries: loadRecentQueries(),
  indexingStatus: { state: 'idle' },
  askCache: new Map(),
  searchCache: new Map(),

  setMode: (mode) => set({ mode }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, answer: null }),
  setAnswer: (answer) => set({ answer, results: [] }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setIndexingStatus: (indexingStatus) => set({ indexingStatus }),

  addRecentQuery: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const current = get().recentQueries.filter((q) => q !== trimmed);
    const updated = [trimmed, ...current].slice(0, MAX_RECENT);
    saveRecentQueries(updated);
    set({ recentQueries: updated });
  },

  reset: () =>
    set({
      mode: 'search',
      query: '',
      results: [],
      answer: null,
      isLoading: false,
      error: null,
      indexingStatus: { state: 'idle' },
      // Preserve caches across repo switches — they're keyed by owner/repo
    }),
}));
