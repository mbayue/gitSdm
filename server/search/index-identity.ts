import { hashToken, hashContext } from '../cache/lru';
import type { RequestContext } from '../utils/context';

/** Include model and endpoint configuration so incompatible embeddings never mix. */
export function embeddingIdentity(): string {
  return hashContext(
    JSON.stringify([
      process.env.AI_PROVIDER ?? 'mock',
      process.env.EMBEDDING_DIMENSIONS ?? '3072',
      process.env.OPENAI_EMBEDDING_MODEL,
      process.env.GEMINI_EMBEDDING_MODEL,
      process.env.EDGEONE_EMBEDDING_MODEL,
      process.env.OPENAI_API_BASE,
      process.env.EDGEONE_API_BASE,
      !!process.env.GEMINI_API_KEY,
      !!process.env.OPENAI_API_KEY,
      !!(process.env.EDGEONE_API_KEY || process.env.MAKERS_MODELS_KEY),
    ]),
  );
}

export function searchIndexKey(
  owner: string,
  repo: string,
  sha: string,
  ctx?: Pick<RequestContext, 'gitHubToken'>,
): string {
  const scope = hashToken(ctx?.gitHubToken || process.env.GITHUB_TOKEN || 'anonymous');
  return `${owner.toLowerCase()}/${repo.toLowerCase()}@${sha}:${scope}:${embeddingIdentity()}`;
}
