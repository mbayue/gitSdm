import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { getVisibleRepoPresets } from "@/components/home/repoPresets";
import { fetchAppConfig } from "@/lib/apiClient";
import { parseRepoFromUrl, LAST_REPO_KEY } from "@/lib/utils";

interface RepoInputProps {
  initialUrl?: string;
}

export { REPO_PRESETS as PRESETS } from "@/components/home/repoPresets";

export interface RepoNavigation {
  owner: string;
  repo: string;
  route: string;
  pendingUrl: string;
}

/** Build the canonical GitHub URL for an `owner/repo` preset slug. */
export function getPresetUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

/**
 * Resolve a raw input (URL or `owner/repo`) to its navigation target.
 * Returns `null` when the input is not a valid GitHub repo reference.
 * Pure helper so the preset-click → navigate contract is unit-testable.
 */
export function resolveRepoNavigation(value: string): RepoNavigation | null {
  const trimmed = value.trim();
  const parsed = parseRepoFromUrl(trimmed);
  if (!parsed) return null;
  return {
    owner: parsed.owner,
    repo: parsed.repo,
    route: `/${parsed.owner}/${parsed.repo}`,
    pendingUrl: trimmed,
  };
}

export type OpenRepositoryResult =
  | { ok: true; nav: RepoNavigation }
  | { ok: false; error: string };

/**
 * Pure decision logic for opening a repository from raw input.
 * Returns the navigation target or the error message to display —
 * no side effects, so both the submit flow and the preset-click flow
 * (`handlePreset` → `openRepository`) are unit-testable.
 */
export function resolveOpenRepository(value: string): OpenRepositoryResult {
  const nav = resolveRepoNavigation(value);
  if (!nav) {
    return {
      ok: false,
      error: 'Enter a valid GitHub URL or owner/repo (e.g. facebook/react)',
    };
  }
  return { ok: true, nav };
}

/**
 * Resolve a preset slug (e.g. `facebook/react`) to the navigation that a
 * preset click performs. Preset clicks navigate immediately — they don't
 * just fill the input — so this composes `getPresetUrl` with the same
 * resolution `openRepository` uses, and is covered by interaction-contract
 * tests in `RepoInput.test.ts`.
 */
export function resolvePresetNavigation(repo: string): OpenRepositoryResult {
  return resolveOpenRepository(getPresetUrl(repo));
}

export function RepoInput({ initialUrl = "" }: RepoInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: config } = useQuery({
    queryKey: ["appConfig"],
    queryFn: fetchAppConfig,
    staleTime: 1000 * 60 * 60,
  });

  const showMockPresets = config?.aiProvider === "mock";

  const presets = useMemo(
    () => getVisibleRepoPresets(showMockPresets),
    [showMockPresets],
  );

  const openRepository = (value: string) => {
    setError("");
    const result = resolveOpenRepository(value);
    if (!result.ok) {
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    commitNavigation(result.nav);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openRepository(url);
  };

  const handlePreset = (repo: string) => {
    // Preset clicks navigate immediately ("Open an example"), they don't
    // just fill the input. The target comes from resolvePresetNavigation —
    // the unit covered by the preset-click contract tests — so the tested
    // function IS the click path, not a parallel implementation of it.
    setError("");
    const result = resolvePresetNavigation(repo);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Keep the input in sync for context.
    setUrl(result.nav.pendingUrl);
    commitNavigation(result.nav);
  };

  /** Side-effect half of opening a repo; all decisions live in the tested resolvers above. */
  function commitNavigation(nav: RepoNavigation) {
    localStorage.setItem(LAST_REPO_KEY, nav.pendingUrl);
    setLoading(true);

    try {
      navigate(nav.route, {
        state: { pendingUrl: nav.pendingUrl },
      });
    } catch {
      setError("Failed to navigate");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl scroll-mt-20 px-0">
      <div className="flex flex-col gap-3">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <label
            htmlFor="repository-url"
            className="text-sm font-medium text-foreground"
          >
            GitHub repository
          </label>
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="repository-url"
              ref={inputRef}
              aria-invalid={!!error}
              aria-describedby={error ? "repository-error" : "repository-hint"}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError("");
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="github.com/owner/repo"
              className="h-12 border-border bg-background pl-10 pr-4 text-base text-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 md:text-base dark:bg-background"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-12 justify-between rounded-lg border-0 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-ui-primary-hover"
          >
            {loading ? (
              <span role="status" className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Opening repository…
              </span>
            ) : (
              <>
                Analyze repository <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p id="repository-hint" className="text-xs leading-5 text-muted-foreground">
          Accepts a GitHub URL or owner/repository.
        </p>

        {error && (
          <p
            id="repository-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {/* Example chips */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="w-full text-sm text-muted-foreground">Open an example</span>
          {presets.slice(0, 3).map((item) => (
            <button
              key={item.repo}
              type="button"
              onClick={() => handlePreset(item.repo)}
              disabled={loading}
              className="min-h-10 cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:bg-secondary disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
