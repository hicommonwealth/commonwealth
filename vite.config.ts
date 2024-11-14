/// <reference types="vitest" />

import * as dotenv from 'dotenv';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

const pkg = process.env.npm_package_name!;
const parallel = !['@hicommonwealth/model', 'commonwealth'].includes(pkg);

console.log('vitest:', pkg, 'parallel:', parallel);

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    sequence: { concurrent: false },
    fileParallelism: parallel,
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
