import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  globalSetup: './globalSetup.ts',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['playwright-json-summary-reporter']],
  webServer: {
    command: 'yarn start',
    url: 'http://localhost:8080',
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
    reuseExistingServer: true,
  },
};

export default config;
