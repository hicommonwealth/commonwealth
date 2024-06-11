/// <reference types="vitest" />

import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: path.resolve(
      __dirname,
      './libs/model/src/tester/vitestDatabaseSetup.ts',
    ),
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
    },
  },
});
