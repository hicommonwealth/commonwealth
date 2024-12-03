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
      // lifecycle tests in forks pool (uses node:child_process)
      ['**/libs/model/**/*-lifecycle.spec.ts', 'forks'],
      // everything else runs in threads pool
    ],
    poolOptions: {
      threads: { minThreads: 1, maxThreads: 1 },
      forks: { minForks: 1, maxForks: 5 },
    },
    fileParallelism: process.env.npm_package_name === '@hicommonwealth/model',
    sequence: { concurrent: false },
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', '**/migrations/**', '**/node_modules/**'],
      provider: 'istanbul',
      reporter:
        process.env.CI === 'true'
          ? ['lcovonly']
          : ['text', ['json', { file: 'coverage.json' }], 'html'],
      reportsDirectory: './coverage',
    },
  },
});
