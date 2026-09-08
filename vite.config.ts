import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { apiMiddleware } from './server/dev-api';
import { visualizer } from "rollup-plugin-visualizer";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  plugins: [tailwindcss(), react(), apiMiddleware(),
  visualizer({
    filename: "dist/stats.html",
    open: !isCi,
    gzipSize: true,
    brotliSize: true,
  }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/mermaid/') || id.includes('\\mermaid\\') || id.endsWith('/mermaid') || id.endsWith('\\mermaid')) {
            return 'mermaid';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
  server: {
    port: 5173,
  },
});
