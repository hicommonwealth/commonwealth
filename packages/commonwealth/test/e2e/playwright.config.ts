import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  globalSetup: './globalSetup.ts',
  timeout: 120_000,
  fullyParallel: true,
  reporter: [['list'], ['playwright-json-summary-reporter']],
  webServer: {
    command: 'yarn start',
    url: 'http://localhost:8080',
    stdout: 'pipe',
    stderr: 'pipe',
  },
};

export default config;
