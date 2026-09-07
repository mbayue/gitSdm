import { ArrowRight, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";
import { RepoInput } from "@/components/home/RepoInput";
import { HomeGraphPreview } from "@/components/home/HomeGraphPreview";
import { parseRepoFromUrl } from "@/lib/utils";

interface HeroSectionProps {
  initialUrl?: string;
}

export function HeroSection({ initialUrl = "" }: HeroSectionProps) {
  const lastRepo = parseRepoFromUrl(initialUrl);
  return (
    <section id="analyze" className="home-container scroll-mt-24 pb-12">
      <div className="hero-intro">
        <div>
          <p className="eyebrow mb-3">Repository explorer</p>
          <h1 className="hero-title">
            Understand the <span>whole codebase.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Open a GitHub repository to explore its dependencies, inspect files,
            and find where to start.
          </p>
        </div>
      </div>
      <div className="home-workbench">
        <div className="repo-launcher flex flex-col">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold tracking-tight">
            <GitBranch className="h-5 w-5 text-accent" /> Open a repository
          </h2>
          <p className="mb-6 text-base leading-6 text-muted-foreground">
            Paste a link or choose an example below.
          </p>
          <RepoInput initialUrl={initialUrl} />
          {lastRepo && (
            <Link
              to={`/${lastRepo.owner}/${lastRepo.repo}`}
              className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-accent hover:bg-secondary"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Last opened</span>
                <span className="block truncate font-medium">{lastRepo.owner}/{lastRepo.repo}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
            </Link>
          )}
          <p className="mt-auto pt-6 text-xs leading-5 text-muted-foreground">
            Public repositories need no account. Private repositories require a GitHub token.
          </p>
        </div>
        <HomeGraphPreview />
      </div>
    </section>
  );
}
