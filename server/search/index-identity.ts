import { embeddingConfig } from './embedding-config';
import { hashToken, hashContext } from '../cache/lru';
import type { RequestContext } from '../utils/context';

/** Decode the canonical key only here; callers must retain every authorization/model/path field. */
export function searchIndexIdentity(key: string): { snapshotSha: string; family: string } {
  const separator = key.indexOf('@');
  const end = key.indexOf(':', separator + 1);
  if (separator < 1 || end <= separator + 1) throw new Error('Invalid search index identity');
  return { snapshotSha: key.slice(separator + 1, end), family: key.slice(0, separator + 1) + key.slice(end) };
}

export function indexRequestKey(
  owner: string,
  repo: string,
  buildId: string,
  ctx: Pick<RequestContext, 'gitHubToken'>,
): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}:${hashToken(ctx.gitHubToken || process.env.GITHUB_TOKEN || 'anonymous')}:${buildId}`;
}

/** Include model and endpoint configuration so incompatible embeddings never mix. */
export function embeddingIdentity(): string {
  return hashContext(
    JSON.stringify([
      embeddingConfig().provider,
      embeddingConfig().model,
      embeddingConfig().provider === 'openai' ? embeddingConfig().baseURL : undefined,
      process.env.EMBEDDING_DIMENSIONS ?? '3072',
    ]),
  );
}

export function searchIndexKey(
  owner: string,
  repo: string,
  sha: string,
  ctx?: Pick<RequestContext, 'gitHubToken'>,
  includePaths: string[] = [],
  excludePaths: string[] = [],
): string {
  const scope = hashToken(ctx?.gitHubToken || process.env.GITHUB_TOKEN || 'anonymous');
  const paths = JSON.stringify({
    includePaths: [...includePaths].sort(),
    excludePaths: [...excludePaths].sort(),
  });
  return `${owner.toLowerCase()}/${repo.toLowerCase()}@${sha}:${scope}:${embeddingIdentity()}:${hashContext(paths)}`;
}
