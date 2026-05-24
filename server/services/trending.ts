import { getOctokit, handleOctokitError } from '../github/client';
import type { TrendingRepo } from '../../src/types';

const FALLBACK: TrendingRepo[] = [
  { owner: 'facebook', repo: 'react', fullName: 'facebook/react', description: 'The library for web and native user interfaces', stars: 230000, language: 'JavaScript', url: 'https://github.com/facebook/react' },
  { owner: 'vercel', repo: 'next.js', fullName: 'vercel/next.js', description: 'The React Framework', stars: 130000, language: 'JavaScript', url: 'https://github.com/vercel/next.js' },
  { owner: 'microsoft', repo: 'vscode', fullName: 'microsoft/vscode', description: 'Visual Studio Code', stars: 170000, language: 'TypeScript', url: 'https://github.com/microsoft/vscode' },
  { owner: 'tailwindlabs', repo: 'tailwindcss', fullName: 'tailwindlabs/tailwindcss', description: 'A utility-first CSS framework', stars: 85000, language: 'TypeScript', url: 'https://github.com/tailwindlabs/tailwindcss' },
  { owner: 'oven-sh', repo: 'bun', fullName: 'oven-sh/bun', description: 'Incredibly fast JavaScript runtime', stars: 75000, language: 'Zig', url: 'https://github.com/oven-sh/bun' },
  { owner: 'rust-lang', repo: 'rust', fullName: 'rust-lang/rust', description: 'Empowering everyone to build reliable software', stars: 98000, language: 'Rust', url: 'https://github.com/rust-lang/rust' },
];

export async function fetchTrending(): Promise<TrendingRepo[]> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.search.repos({
      q: 'stars:>50000',
      sort: 'stars',
      order: 'desc',
      per_page: 12,
    });

    return data.items.map((item) => ({
      owner: item.owner?.login ?? '',
      repo: item.name,
      fullName: item.full_name,
      description: item.description,
      stars: item.stargazers_count,
      language: item.language,
      url: item.html_url,
    }));
  } catch (e) {
    try {
      handleOctokitError(e);
    } catch {
      return FALLBACK;
    }
    return FALLBACK;
  }
}
