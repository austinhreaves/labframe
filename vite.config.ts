import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Vite config for the IPL frontend.
// Local UI-only dev: `npm run dev` (or `npm run dev:vite`) runs Vite without `/api/*`.
// Full-stack local dev: `npm run dev:vercel` runs Vercel dev with serverless functions.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    // Vite-only mode is intentionally UI-only.
  },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
});
