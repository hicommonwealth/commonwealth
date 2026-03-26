import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCI = !!process.env.CI;
const apiPort =
  process.env.PORT || (isCI ? '8080' : process.env.E2E_API_PORT || '3051');
const vitePort = process.env.E2E_VITE_PORT || '8051';
const baseURL =
  process.env.SERVER_URL ||
  (isCI ? `http://localhost:${apiPort}` : `http://localhost:${vitePort}`);
const repoRoot = path.resolve(__dirname, '../../../..');
const cwdPackage = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: './visual-report' }]],
  outputDir: './test-results',
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    screenshot: 'off', // We take manual screenshots with toHaveScreenshot()
  },
  webServer: isCI
    ? {
        command: `pnpm -F commonwealth bootstrap-test-db && cd packages/commonwealth && PORT=${apiPort} NODE_ENV=test SERVICE=web node --import=extensionless/register --enable-source-maps ./build/server.js`,
        cwd: repoRoot,
        url: `http://localhost:${apiPort}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : [
        {
          command: `pnpm bootstrap-test-db && PORT=${apiPort} NODE_ENV=test SERVICE=web tsx watch --max-old-space-size=4096 server.ts`,
          cwd: cwdPackage,
          url: `http://localhost:${apiPort}/api/health`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: `BACKEND_PROXY_URL=http://localhost:${apiPort} npx vite -c ./client/vite.config.ts --host --port ${vitePort}`,
          cwd: cwdPackage,
          url: `http://localhost:${vitePort}`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
  snapshotDir: './__snapshots__',
});
