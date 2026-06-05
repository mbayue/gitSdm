export function getPublicAppConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    aiProvider: (env.AI_PROVIDER ?? 'mock').toLowerCase(),
  };
}
