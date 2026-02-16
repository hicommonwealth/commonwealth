/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    include: ['test/component/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: [path.resolve(__dirname, './test/component/setup.ts')],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
  },
});
