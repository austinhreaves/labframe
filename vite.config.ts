import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

// Vite config for the IPL frontend.
// Local UI-only dev: `npm run dev` (or `npm run dev:vite`) runs Vite without `/api/*`.
// Full-stack local dev: `npm run dev:vercel` runs Vercel dev with serverless functions.
export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE === 'true'
      ? visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        })
      : null,
  ].filter(Boolean),
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
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'math-vendor': ['mathlive'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'remark-math', 'remark-parse', 'rehype-katex', 'rehype-sanitize', 'unified'],
          'katex-vendor': ['katex'],
        },
      },
    },
  },
});
