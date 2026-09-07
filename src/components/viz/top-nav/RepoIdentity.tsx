import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RepoIdentityProps {
  owner: string;
  repoName: string;
}

export function RepoIdentity({ owner, repoName }: RepoIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-5">
      <Link
        to="/"
        className="flex shrink-0 items-center gap-2"
        aria-label="Go to homepage"
      >
        <span className="brand-mark">
          <GitBranch className="h-4 w-4" />
        </span>
        <span className="hidden text-base font-semibold tracking-tight xl:inline">
          gitSdm<span className="text-accent">.</span>
        </span>
      </Link>
      <span className="hidden text-border sm:inline">/</span>
      <Tooltip>
      <TooltipTrigger render={<a
        href={`https://github.com/${owner}/${repoName}`}
        target="_blank"
        rel="noreferrer"
      />}
        className="min-w-0 truncate text-sm hover:text-accent"
      >
        <span className="hidden text-muted-foreground sm:inline">
          {owner} /{" "}
        </span>
        <span className="font-semibold">{repoName}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{owner}/{repoName}</TooltipContent>
      </Tooltip>
    </div>
  );
}
