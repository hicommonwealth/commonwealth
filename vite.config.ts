/// <reference types="vitest" />

import * as dotenv from 'dotenv';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

const pkg = process.env.npm_package_name;
console.log('vitest:', pkg);

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    sequence: { concurrent: false },
    fileParallelism: false, // pkg !== '@hicommonwealth/model',
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
