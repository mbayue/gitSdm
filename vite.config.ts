import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { apiMiddleware } from './server/dev-api';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [tailwindcss(), react(), apiMiddleware(),
  visualizer({
    filename: "dist/stats.html",
    open: true,
    gzipSize: true,
    brotliSize: true,
  }),
  ],
  build: {
    chunkSizeWarningLimit: 3000,
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
