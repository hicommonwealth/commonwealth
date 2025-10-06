/// <reference types="vitest" />
import * as dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@hicommonwealth/shared': path.resolve(
        __dirname,
        './libs/shared/src/index.ts',
      ),
      '@hicommonwealth/schemas': path.resolve(
        __dirname,
        './libs/schemas/src/index.ts',
      ),
      '@hicommonwealth/adapters': path.resolve(
        __dirname,
        './libs/adapters/src/index.ts',
      ),
      '@hicommonwealth/core': path.resolve(
        __dirname,
        './libs/core/src/index.ts',
      ),
      '@hicommonwealth/evm-protocols': path.resolve(
        __dirname,
        './libs/evm-protocols/src/index.ts',
      ),
      '@hicommonwealth/evm-testing': path.resolve(
        __dirname,
        './libs/evm-testing/src/index.ts',
      ),
      '@hicommonwealth/model/tester': path.resolve(
        __dirname,
        './libs/model/src/tester/index.ts',
      ),
      '@hicommonwealth/model/middleware': path.resolve(
        __dirname,
        './libs/model/src/middleware/index.ts',
      ),
      '@hicommonwealth/model/models': path.resolve(
        __dirname,
        './libs/model/src/models/index.ts',
      ),
      '@hicommonwealth/model/db': path.resolve(
        __dirname,
        './libs/model/src/database.ts',
      ),
      '@hicommonwealth/model/services': path.resolve(
        __dirname,
        './libs/model/src/services/index.ts',
      ),
      '@hicommonwealth/model/tbc': path.resolve(
        __dirname,
        './libs/model/src/services/tokenBalanceCache/index.ts',
      ),
      '@hicommonwealth/model/protocol': path.resolve(
        __dirname,
        './libs/model/src/services/commonProtocol/index.ts',
      ),
      '@hicommonwealth/model': path.resolve(
        __dirname,
        './libs/model/src/index.ts',
      ),
    },
  },
  test: {
    // Enables parallel lifecycle tests
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
    fileParallelism: process.env.npm_package_name !== 'commonwealth',
    testTimeout: 20_000,

    // Disables parallel lifecycle tests
    // fileParallelism: false,

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
