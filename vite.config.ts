/// <reference types="vitest" />
import * as dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: [path.resolve(__dirname, './libs/model/src/vitest.setup.ts')],
    poolMatchGlobs: [
      ['**/*-lifecycle.spec.ts', 'threads'],
      ['**/*.spec.ts', 'forks'],
    ],
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 5,
      },
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },
    sequence: { concurrent: false },
    reporters: ['default'],
    coverage: {
      provider: 'istanbul',
      reporter:
        process.env.CI === 'true'
          ? ['lcovonly']
          : ['text', ['json', { file: 'coverage.json' }], 'html'],
      reportsDirectory: './coverage',
    },
  },
});
