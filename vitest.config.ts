import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// In the real Vite build a `.ttf` import becomes a fetchable asset URL, but under
// the jsdom/node test runner react-pdf's font loader reads `src` from the
// filesystem. Resolve font imports to their absolute on-disk path so PDF render
// tests can actually load the bundled fonts.
const fontPathPlugin = {
  name: 'ttf-as-fs-path',
  enforce: 'pre' as const,
  load(id: string) {
    if (id.endsWith('.ttf')) {
      return `export default ${JSON.stringify(id)};`;
    }
    return null;
  },
};

export default defineConfig({
  plugins: [react(), fontPathPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.ts',
      ],
    },
    include: ['tests/unit/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
