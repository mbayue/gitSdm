import { TooltipHint } from '@/components/ui/tooltip';
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, GitBranch, Star } from "lucide-react";
import { fetchTrending } from "@/lib/apiClient";
import { formatStars } from "@/lib/utils";

export function Trending() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending,
  });
  return (
    <section
      id="examples"
      className="home-container home-section scroll-mt-20 border-t border-border"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow mb-3">Explore open source</p>
          <h2>Choose your next codebase.</h2>
        </div>
        <a
          href="https://github.com/trending"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Trending on GitHub <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      {isLoading && (
        <div
          className="grid gap-4 md:grid-cols-3"
          aria-label="Loading repositories"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Could not load trending repositories.{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-2 text-accent underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {data?.slice(0, 6).map((repo) => (
          <Link
            key={repo.fullName}
            to={`/${repo.owner}/${repo.repo}`}
            className="repo-card group"
          >
            <div className="mb-6 flex items-center justify-between">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
            </div>
            <TooltipHint content={repo.fullName}><h3
              className="truncate text-base font-medium"
            >
              {repo.fullName}
            </h3></TooltipHint>
            <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
              {repo.description ||
                "Explore the files and dependencies behind this project."}
            </p>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {repo.language || "Repository"}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                {formatStars(repo.stars)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
