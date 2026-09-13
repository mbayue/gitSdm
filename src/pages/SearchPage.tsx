import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useSearchStore } from '@/features/search/searchStore';
import { useVizStore } from '@/stores/vizStore';
import { SearchBar } from '@/features/search/SearchBar';
import { ModeToggle } from '@/features/search/ModeToggle';
import { SearchResults } from '@/features/search/SearchResults';
import { QAAnswerView } from '@/features/search/QAAnswerView';
import { SearchIndexControls } from '@/features/search/SearchIndexControls';
import { useSemanticSearch } from '@/features/search/useSemanticSearch';
import { useSemanticAsk } from '@/features/search/useSemanticAsk';
import { useTriggerIndexing } from '@/features/search/useTriggerIndexing';
import { useIndexingStatus } from '@/features/search/useIndexingStatus';
import { coverageMessage } from '../../server/search/coverage';
import { SearchEmptyState } from '@/features/search/SearchEmptyState';

import { parsePaths } from '@/features/search/parsePaths';
import {
  isSearchEnabled,
  resolveBuildId,
  resolveRequestBranch,
  resolveRunningSha,
  shouldResetSearchState,
} from './search-page-logic';

export function SearchPage() {
  const { owner = '', repo = '' } = useParams();
  const navigate = useNavigate();
  const { mode, error, isLoading, results, answer, indexingStatus } = useSearchStore();
  const searchMutation = useSemanticSearch();
  const askMutation = useSemanticAsk();
  const indexMutation = useTriggerIndexing();
  const branch = useVizStore((state) => state.selectedBranch) ?? undefined;
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const indexScope = useMemo(
    () => ({
      includePaths: parsePaths(includeInput),
      excludePaths: parsePaths(excludeInput),
    }),
    [includeInput, excludeInput],
  );
  const runningSha = resolveRunningSha(indexingStatus);
  useIndexingStatus(owner, repo, true, runningSha ?? branch, indexScope);
  // Changing scope invalidates cached results, but must never abandon an active
  // index operation (its completion would be ignored and a duplicate build could start).
  useEffect(() => {
    const state = useSearchStore.getState();
    if (shouldResetSearchState(state)) state.reset();
  }, [includeInput, excludeInput]);

  // Clear previous results on entry and when the repository snapshot changes.
  useEffect(() => {
    const state = useSearchStore.getState();
    // Preserve an active index operation across remounts and branch switches;
    // only its stale results are cleared while polling keeps tracking the snapshot.
    if (shouldResetSearchState(state)) state.reset();
    else state.resetQueryResults();
    setIncludeInput('');
    setExcludeInput('');
  }, [owner, repo, branch]);

  const handleSubmit = useCallback(
    (query: string) => {
      if (mode === 'search')
        searchMutation.mutate({
          query,
          owner,
          repo,
          branch: resolveRequestBranch(runningSha, branch),
          scope: indexScope,
        });
      else
        askMutation.mutate({
          question: query,
          owner,
          repo,
          branch: resolveRequestBranch(runningSha, branch),
          scope: indexScope,
        });
    },
    [mode, owner, repo, branch, runningSha, indexScope, searchMutation, askMutation],
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
    const state = useSearchStore.getState();
    if (state.indexAction) return;
    indexMutation.mutate({
      owner,
      repo,
      branch: resolveRequestBranch(runningSha, branch),
      scope: indexScope,
      buildId: resolveBuildId(state.indexingStatus, state.indexBuildId),
    });
  }, [owner, repo, branch, runningSha, indexScope, indexMutation]);

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
  const isSearchDisabled = !isSearchEnabled(indexingStatus);
  const responseCoverage = useSearchStore((state) => state.resultCoverage);
  const hasResults = mode === 'search' ? results.length > 0 : answer !== null;
  const showEmptyHero = !hasResults && !isLoading;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background font-sans">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
        <button
          onClick={() => navigate(`/${owner}/${repo}`)}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Semantic Search</span>
          <span className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {owner}/{repo}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 shrink-0">
          <p className="eyebrow mb-4">
            <Search className="h-3.5 w-3.5 text-accent" /> Search &amp; discover
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Find the idea behind the code.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Search by meaning, ask a question, and follow the answer to its source.
          </p>
        </div>
        {/* Indexing status banner */}
        <SearchIndexControls
          owner={owner}
          repo={repo}
          branch={runningSha ?? branch}
          scope={indexScope}
          includeInput={includeInput}
          excludeInput={excludeInput}
          onIncludeChange={setIncludeInput}
          onExcludeChange={setExcludeInput}
          onIndex={handleIndex}
        />

        {/* Compact controls area */}
        <div className="flex flex-col gap-4">
          {/* Search controls */}
          <div className="flex flex-col gap-3">
            {/* Onboarding text when empty */}
            {showEmptyHero && isSearchDisabled && (
              <div className="flex flex-col gap-1 mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Build an index to search this repository by meaning.
                </h2>
              </div>
            )}

            {/* Mode toggle + description */}
            <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <ModeToggle />
              <span className="text-[11px] text-muted-foreground transition-colors duration-200">
                {mode === 'search'
                  ? 'Find code snippets by semantic similarity.'
                  : 'Answers cover indexed files only, with source citations.'}
              </span>
            </div>

            {/* Search bar */}
            <div className="w-full">
              <SearchBar onSubmit={handleSubmit} disabled={isSearchDisabled} />
            </div>
          </div>

          {/* Empty State Content */}
          {showEmptyHero && isIndexed && (
            <SearchEmptyState chunkCount={indexingStatus.chunkCount} onSubmit={handleSubmit} />
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          {/* No results message */}
          {responseCoverage && <p className="text-xs text-muted-foreground">{coverageMessage(responseCoverage)}</p>}
          {!isLoading && !error && mode === 'search' && results.length === 0 && searchMutation.isSuccess && (
            <div className="py-8 text-sm text-muted-foreground flex justify-center">
              {responseCoverage?.kind === 'partial'
                ? 'No matches in indexed files yet.'
                : 'No matching code found. Try broader terms or switch to Ask mode.'}
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
