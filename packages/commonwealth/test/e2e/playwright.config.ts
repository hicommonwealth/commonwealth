import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['playwright-json-summary-reporter']],
};

export default config;
