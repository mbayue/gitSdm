import { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSearchStore } from '@/features/search/searchStore';
import { useVizStore } from '@/stores/vizStore';
import { SearchBar } from '@/features/search/SearchBar';
import { ModeToggle } from '@/features/search/ModeToggle';
import { SearchResults } from '@/features/search/SearchResults';
import { QAAnswerView } from '@/features/search/QAAnswerView';
import { IndexingStatusPanel } from '@/features/search/IndexingStatusPanel';
import { useSemanticSearch } from '@/features/search/useSemanticSearch';
import { useSemanticAsk } from '@/features/search/useSemanticAsk';
import { useTriggerIndexing } from '@/features/search/useTriggerIndexing';
import { useIndexingStatus } from '@/features/search/useIndexingStatus';

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
    (filePath: string, _startLine: number, action: 'open' | 'inspect' = 'open') => {
      const { setFocusedFilePath, setInspectorOpen, setSelectedNodeId } = useVizStore.getState();
      
      setSelectedNodeId(null);
      setFocusedFilePath(filePath);
      
      if (action === 'open') {
        setInspectorOpen(true);
      } else {
        setInspectorOpen(false);
      }
      
      navigate(`/${owner}/${repo}`);
    },
    [navigate, owner, repo],
  );

  const isIndexed = indexingStatus.state === 'complete';
  const isSearchDisabled = !isIndexed;
  const hasResults = mode === 'search' ? results.length > 0 : answer !== null;
  const showEmptyHero = !hasResults && !isLoading;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117] font-sans">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-4">
        <button
          onClick={() => navigate(`/${owner}/${repo}`)}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-[#8b949e] transition-colors duration-200 hover:text-[#e6edf3]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#e6edf3]">Semantic Search</span>
          <span className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] px-1.5 py-0.5 text-[10px] font-medium text-[#8b949e]">
            {owner}/{repo}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto p-6">
        {/* Indexing status banner */}
        <div className="mb-4 shrink-0">
          <IndexingStatusPanel onRetry={handleIndex} />
        </div>

        {/* Compact controls area */}
        <div className="flex flex-col gap-4">
          {/* Search controls */}
          <div className="flex flex-col gap-3">
            {/* Onboarding text when empty */}
            {showEmptyHero && isSearchDisabled && (
              <div className="flex flex-col gap-1 mb-4">
                <h2 className="text-sm font-semibold text-[#e6edf3]">
                  Build an index to search this repository by meaning.
                </h2>
              </div>
            )}

            {/* Mode toggle + description */}
            <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <ModeToggle />
              <span className="text-[11px] text-[#8b949e] transition-colors duration-200">
                {mode === 'search'
                  ? 'Find code snippets by semantic similarity.'
                  : 'Ask a repository question with source citations.'}
              </span>
            </div>

            {/* Search bar */}
            <div className="w-full">
              <SearchBar
                onSubmit={handleSubmit}
                disabled={isSearchDisabled}
              />
            </div>
          </div>

          {/* Empty State Content */}
          {showEmptyHero && isIndexed && (
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-[10px] font-semibold text-[#8b949e] mb-3 uppercase tracking-widest">Search Examples</h3>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {[
                    "How are API errors handled?",
                    "Where is GitHub data fetched?",
                    "How is the dependency graph generated?"
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => {
                        useSearchStore.getState().setQuery(example);
                        handleSubmit(example);
                      }}
                      className="px-3 py-1.5 text-xs text-[#e6edf3] bg-[#161b22] border border-[rgba(240,246,252,0.1)] rounded-md hover:border-[rgba(240,246,252,0.3)] hover:bg-[rgba(240,246,252,0.05)] transition-all text-left"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-[10px] font-semibold text-[#8b949e] mb-3 uppercase tracking-widest">Recent Queries</h3>
                  <div className="text-[11px] text-[#8b949e] italic p-3 border border-[rgba(240,246,252,0.1)] rounded-md bg-[#0d1117] flex items-center justify-center h-[76px]">
                    No recent queries yet.
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold text-[#8b949e] mb-3 uppercase tracking-widest">Index Details</h3>
                  <div className="text-[11px] text-[#e6edf3] p-3 border border-[rgba(240,246,252,0.1)] rounded-md bg-[#161b22] h-[76px] flex flex-col justify-center space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Status</span>
                      <span className="flex items-center gap-1.5 text-ui-active-text-green font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-ui-active-text-green shadow-[0_0_8px_rgba(230,237,243,0.4)]" />
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Chunks Indexed</span>
                      <span className="font-mono text-xs">{indexingStatus.chunkCount}</span>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="py-8 text-sm text-[#8b949e] flex justify-center">
                No matching code found. Try broader terms or switch to Ask mode.
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
