import { z } from 'zod';

const repoSchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/),
});

export type ParsedRepo = z.infer<typeof repoSchema>;

export function parseGitHubUrl(input: string): ParsedRepo | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');

  const patterns = [
    /github\.com\/([^/]+)\/([^/?#]+)/i,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const result = repoSchema.safeParse({ owner: match[1], repo: match[2] });
      if (result.success) return result.data;
    }
  }

  return null;
}

export function parseRepoParams(
  owner?: string,
  repo?: string,
  url?: string,
): ParsedRepo | null {
  if (owner && repo) {
    const result = repoSchema.safeParse({ owner, repo });
    if (result.success) return result.data;
  }
  if (url) return parseGitHubUrl(url);
  return null;
}
