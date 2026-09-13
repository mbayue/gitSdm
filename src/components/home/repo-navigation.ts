import { parseRepoFromUrl } from "@/lib/utils";
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
const GITHUB_OWNER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const GITHUB_REPO_RE = /^[a-zA-Z0-9-._]+$/;

export function isValidRepoIdentifier(owner: string, repo: string): boolean {
  return (
    owner.length >= 1 &&
    owner.length <= 39 &&
    !owner.includes('--') &&
    !owner.startsWith('-') &&
    !owner.endsWith('-') &&
    GITHUB_OWNER_RE.test(owner) &&
    repo.length >= 1 &&
    repo.length <= 100 &&
    GITHUB_REPO_RE.test(repo)
  );
}

export function resolveRepoNavigation(value: string): RepoNavigation | null {
  const trimmed = value.trim();
  const parsed = parseRepoFromUrl(trimmed);
  if (!parsed || !isValidRepoIdentifier(parsed.owner, parsed.repo)) return null;
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

