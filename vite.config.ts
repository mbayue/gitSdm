import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { apiMiddleware } from './server/dev-api';

export default defineConfig({
  plugins: [react(), apiMiddleware()],
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
