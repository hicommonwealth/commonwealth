import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@hicommonwealth/shared': resolve(__dirname, '../shared/src'),
      '@hicommonwealth/core': resolve(__dirname, '../core/src'),
      '@hicommonwealth/model': resolve(__dirname, '../model/src'),
      '@hicommonwealth/adapters': resolve(__dirname, '../adapters/src'),
    },
  },
});
