import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['playwright-json-summary-reporter']],
};

export default config;
