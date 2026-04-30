import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Vite config for the IPL frontend.
// Local dev: `npm run dev` runs Vite alone (no /api/* available — use `vercel dev` for that).
// Local dev with serverless functions: `npm run dev:vercel` runs Vercel's dev server,
// which proxies Vite output and runs the api/ functions in-process.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    // When running plain Vite, /api requests have nowhere to go.
    // Document this in the README; prefer `vercel dev` for full-stack local work.
  },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
});
