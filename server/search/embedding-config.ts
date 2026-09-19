import { AppError } from '../utils/errors';
import { isSafeRemoteUrl } from '../utils/url-guard';

/** Explicit embedding settings take precedence; legacy provider settings remain compatible. */
export function embeddingConfig(env: Record<string, string | undefined> = process.env) {
  const value = (name: string) => env[name]?.trim() || undefined;
  const explicit = value('EMBEDDING_PROVIDER')?.toLowerCase();
  const requested = (explicit ?? value('AI_PROVIDER') ?? 'mock').toLowerCase();
  const provider =
    !explicit && requested === 'anthropic'
      ? value('GEMINI_API_KEY')
        ? 'gemini'
        : value('OPENAI_API_KEY')
          ? 'openai'
          : requested
      : requested;
  const baseURL = value('EMBEDDING_API_BASE') ?? value('OPENAI_API_BASE');
  // Fail closed before the key leaves the process: only public HTTPS endpoints allowed.
  if (baseURL && !isSafeRemoteUrl(baseURL))
    throw new AppError(400, 'Embedding endpoint must be a public HTTPS URL.', 'EMBEDDING_PROVIDER_UNAVAILABLE');
  return {
    provider,
    apiKey: value('EMBEDDING_API_KEY') ?? (provider === 'gemini' ? value('GEMINI_API_KEY') : value('OPENAI_API_KEY')),
    baseURL,
    model:
      value('EMBEDDING_MODEL') ??
      (provider === 'gemini'
        ? (value('GEMINI_EMBEDDING_MODEL') ?? 'gemini-embedding-001')
        : (value('OPENAI_EMBEDDING_MODEL') ?? 'openrouter/openai/text-embedding-3-large')),
  };
}
