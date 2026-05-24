import { loadEnv } from 'vite';

let loaded = false;

/** Load .env into process.env for server/API code (Vite dev + build). */
export function loadServerEnv(mode = process.env.NODE_ENV ?? 'development'): void {
  if (loaded) return;
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  loaded = true;
}

