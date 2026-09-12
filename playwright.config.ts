import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: process.env.CI ? 'bun start' : 'bun run build && bun run build:server && bun start',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
    env: {
      AI_PROVIDER: 'mock',
      EMBEDDING_PROVIDER: 'mock',
      API_REQUESTS_PER_MINUTE: '10000',
      API_REQUESTS_PER_IP_PER_MINUTE: '10000',
    },
  },
});
