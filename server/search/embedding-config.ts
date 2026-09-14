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
  return {
    provider,
    apiKey: value('EMBEDDING_API_KEY') ?? (provider === 'gemini' ? value('GEMINI_API_KEY') : value('OPENAI_API_KEY')),
    baseURL: value('EMBEDDING_API_BASE') ?? value('OPENAI_API_BASE'),
    model:
      value('EMBEDDING_MODEL') ??
      (provider === 'gemini'
        ? (value('GEMINI_EMBEDDING_MODEL') ?? 'gemini-embedding-001')
        : (value('OPENAI_EMBEDDING_MODEL') ?? 'openrouter/openai/text-embedding-3-large')),
  };
}
