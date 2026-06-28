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
  const trimmed = url.trim().replace(/\/$/, '').replace(/\.git$/, '');
  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/?#]+)$/i);
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };

  const shorthandMatch = trimmed.match(/^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
  if (shorthandMatch) return { owner: shorthandMatch[1], repo: shorthandMatch[2] };

  try {
    let urlToParse = trimmed;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(urlToParse)) {
      urlToParse = `https://${urlToParse}`;
    }

    const urlObj = new URL(urlToParse);
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
      return null;
    }

    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

export const LAST_REPO_KEY = 'gitsdm:last-repo';
