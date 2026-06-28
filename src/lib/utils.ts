import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function parseRepoFromUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\/$/, '').replace(/\.git$/, '');
  const match =
    trimmed.match(/github\.com(?:\/|:(?!\d))([^/]+)\/([^/?#]+)/i) ?? trimmed.match(/^([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export const LAST_REPO_KEY = 'gitsdm:last-repo';
