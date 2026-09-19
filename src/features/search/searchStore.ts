import { create } from 'zustand';
import type { IndexScope } from '@/lib/apiClient';
import type { SearchResultCard, QAAnswer, IndexingStatus, SearchCoverage } from '@/types';

export type SearchMode = 'search' | 'ask';

interface SearchState {
  indexBuildId?: string;
  indexOperation: number;
  indexAction: 'index' | 'cancel' | null;
  indexScope: IndexScope | null;
  indexOwner: string | null;
  indexRepo: string | null;
  resultCoverage: SearchCoverage | undefined;
  revision: number;
  mode: SearchMode;
  query: string;
  results: SearchResultCard[];
  answer: QAAnswer | null;
  isLoading: boolean;
  error: string | null;
  recentQueries: string[];
  indexingStatus: IndexingStatus;

  setMode: (mode: SearchMode) => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResultCard[]) => void;
  setAnswer: (answer: QAAnswer | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIndexingStatus: (status: IndexingStatus) => void;
  addRecentQuery: (query: string) => void;
  resetQueryResults: () => void;
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
  indexOperation: 0,
  indexAction: null,
  indexScope: null,
  indexOwner: null,
  indexRepo: null,
  resultCoverage: undefined,
  revision: 0,
  mode: 'search',
  query: '',
  results: [],
  answer: null,
  isLoading: false,
  error: null,
  recentQueries: loadRecentQueries(),
  indexingStatus: { state: 'idle' },

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

  resetQueryResults: () =>
    set({
      results: [],
      answer: null,
      error: null,
      resultCoverage: undefined,
      isLoading: false,
      // Invalidate in-flight search/ask responses; the active index operation
      // is keyed by indexOperation (not revision) so polling keeps tracking it.
      revision: get().revision + 1,
    }),

  reset: () =>
    set({
      revision: get().revision + 1,
      indexOperation: get().indexOperation + 1,
      indexAction: null,
      indexBuildId: undefined,
      indexScope: null,
      indexOwner: null,
      indexRepo: null,
      mode: 'search',
      query: '',
      results: [],
      resultCoverage: undefined,
      answer: null,
      isLoading: false,
      error: null,
      indexingStatus: { state: 'idle' },
    }),
}));
