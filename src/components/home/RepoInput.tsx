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
    const parsed = parseRepoFromUrl(value.trim());
    if (!parsed) {
      setError("Enter a valid GitHub URL or owner/repo (e.g. facebook/react)");
      inputRef.current?.focus();
      return;
    }

    localStorage.setItem(LAST_REPO_KEY, value.trim());
    setLoading(true);

    try {
      navigate(`/${parsed.owner}/${parsed.repo}`, {
        state: { pendingUrl: value.trim() },
      });
    } catch {
      setError("Failed to navigate");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openRepository(url);
  };

  const handlePreset = (repo: string) => {
    const presetUrl = `https://github.com/${repo}`;
    setUrl(presetUrl);
    openRepository(presetUrl);
  };

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
