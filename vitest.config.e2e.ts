import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['test/app.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
