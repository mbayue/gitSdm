export function getPublicAppConfig(env: Record<string, string | undefined> = process.env) {
  return {
    aiProvider: (env.AI_PROVIDER ?? 'mock').toLowerCase(),
  };
}
