import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStars(n: number): string {
  if (n < 1000) return n.toString();
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function parseRepoFromUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const match =
    trimmed.match(/github\.com\/([^/]+)\/([^/?#]+)/i) ?? trimmed.match(/^([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export const LAST_REPO_KEY = 'gitsdm:last-repo';
