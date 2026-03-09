import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CI: built server serves API + frontend on a single port (default 8080).
// Local: API on E2E_API_PORT (default 3001), Vite on E2E_VITE_PORT (default 8081).
// We use non-standard ports locally to avoid conflicts with other running services.
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
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    video: 'on',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  reporter: [['list'], ['playwright-json-summary-reporter']],
  outputDir: './test-results',
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
});
