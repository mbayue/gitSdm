import { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Search, MessageSquare, Code2, Database } from 'lucide-react';
import { useSearchStore } from '@/features/search/searchStore';
import { useVizStore } from '@/stores/vizStore';
import { SearchBar } from '@/features/search/SearchBar';
import { ModeToggle } from '@/features/search/ModeToggle';
import { SearchResults } from '@/features/search/SearchResults';
import { QAAnswerView } from '@/features/search/QAAnswerView';
import { IndexingStatusPanel } from '@/features/search/IndexingStatusPanel';
import {
  useSemanticSearch,
  useSemanticAsk,
  useTriggerIndexing,
  useIndexingStatus,
} from '@/features/search/hooks';

export function SearchPage() {
  const { owner = '', repo = '' } = useParams();
  const navigate = useNavigate();
  const { mode, error, isLoading, results, answer, indexingStatus, askCache, searchCache } = useSearchStore();
  const searchMutation = useSemanticSearch();
  const askMutation = useSemanticAsk();
  const indexMutation = useTriggerIndexing();
  useIndexingStatus(owner, repo);

  // Reset search state when navigating to a different repo's search page
  const prevRepoRef = useRef(`${owner}/${repo}`);
  useEffect(() => {
    const key = `${owner}/${repo}`;
    if (key !== prevRepoRef.current) {
      prevRepoRef.current = key;
      useSearchStore.getState().reset();
    }
  }, [owner, repo]);

  const handleSubmit = useCallback(
    (query: string) => {
      const cacheKey = `${owner}/${repo}:${query}`;

      if (mode === 'search') {
        // Return cached search results if same query
        const cached = searchCache.get(cacheKey);
        if (cached) {
          const { setResults, setIsLoading, setError } = useSearchStore.getState();
          setResults(cached);
          setIsLoading(false);
          setError(null);
          return;
        }
        searchMutation.mutate({ query, owner, repo });
      } else {
        // Return cached answer if same question
        const cached = askCache.get(cacheKey);
        if (cached) {
          const { setAnswer, setIsLoading, setError, addRecentQuery } = useSearchStore.getState();
          setAnswer(cached);
          setIsLoading(false);
          setError(null);
          addRecentQuery(query);
          return;
        }
        askMutation.mutate({ question: query, owner, repo });
      }
    },
    [mode, owner, repo, searchMutation, askMutation, askCache, searchCache],
  );

  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      const currentQuery = useSearchStore.getState().query.trim();
      if (currentQuery.length >= 3 && !useSearchStore.getState().isLoading) {
        handleSubmit(currentQuery);
      }
    }
  }, [mode, handleSubmit]);

  const handleIndex = useCallback(() => {
    indexMutation.mutate({ owner, repo });
  }, [owner, repo, indexMutation]);

  const handleSelectFile = useCallback(
    (filePath: string, _startLine: number) => {
      // Set vizStore state so GraphFocusSync zooms to the node
      // and the code inspector opens when VizPage mounts.
      // If the file doesn't exist in the graph (truncated), GraphFocusSync
      // silently returns without zooming — the inspector will show a
      // "failed to load" message instead.
      const { setFocusedFilePath, setInspectorOpen, setSelectedNodeId } = useVizStore.getState();
      setSelectedNodeId(null);
      setFocusedFilePath(filePath);
      setInspectorOpen(true);
      navigate(`/${owner}/${repo}`);
    },
    [navigate, owner, repo],
  );

  const isIndexed = indexingStatus.state === 'complete';
  const isSearchDisabled = !isIndexed;
  const hasResults = mode === 'search' ? results.length > 0 : answer !== null;
  const showEmptyHero = !hasResults && !isLoading;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl">
        <button
          onClick={() => navigate(`/${owner}/${repo}`)}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400 transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Semantic Search</span>
          <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
            {owner}/{repo}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto p-6">
        {/* Indexing status banner */}
        <div className="mb-4 shrink-0">
          <IndexingStatusPanel onRetry={handleIndex} />
        </div>

        {/* Centered hero area (empty state) or compact controls (with results) */}
        <div className={
          showEmptyHero
            ? 'flex flex-1 flex-col items-center justify-center gap-6 pb-12'
            : 'flex flex-col gap-4'
        }>
          {/* Search controls */}
          <div className={showEmptyHero ? 'flex w-full flex-col items-center gap-4' : 'flex flex-col gap-3'}>
            {/* Onboarding hero content */}
            {showEmptyHero && (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <Database className="h-7 w-7 text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Search your codebase with AI
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                  Find code snippets by meaning, or ask questions about your repository.
                  {isSearchDisabled && (
                    <span className="mt-1 block text-zinc-500">
                      Index the repository first to build vector embeddings.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Mode toggle + description */}
            <div className={showEmptyHero ? 'flex items-center gap-3' : 'flex items-center gap-3'}>
              <ModeToggle />
              <span className="text-[11px] text-zinc-500 transition-colors duration-200">
                {mode === 'search'
                  ? 'Find code snippets by semantic similarity'
                  : 'Get AI-generated answers with source citations'}
              </span>
            </div>

            {/* Search bar */}
            <div className={showEmptyHero ? 'w-full max-w-xl' : 'w-full'}>
              <SearchBar
                onSubmit={handleSubmit}
                disabled={isSearchDisabled}
              />
            </div>
          </div>

          {/* Feature pills (only in hero state) */}
          {showEmptyHero && isIndexed && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: <Search className="h-3 w-3" />, text: 'Semantic code search' },
                { icon: <MessageSquare className="h-3 w-3" />, text: 'Natural language Q&A' },
                { icon: <Code2 className="h-3 w-3" />, text: `${indexingStatus.chunkCount} chunks indexed` },
              ].map((pill) => (
                <span
                  key={pill.text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-zinc-500"
                >
                  {pill.icon}
                  {pill.text}
                </span>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* No results message */}
          {!isLoading &&
            !error &&
            mode === 'search' &&
            results.length === 0 &&
            searchMutation.isSuccess && (
              <div className="py-8 text-center text-sm text-zinc-500">
                No relevant results found. Try a different query or broaden your search.
              </div>
            )}

          {/* Results */}
          {mode === 'search' && <SearchResults onSelectFile={handleSelectFile} />}
          {mode === 'ask' && <QAAnswerView onSelectFile={handleSelectFile} />}
        </div>
      </main>
    </div>
  );
}
