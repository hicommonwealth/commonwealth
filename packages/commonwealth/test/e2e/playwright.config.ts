import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    video: 'retain-on-failure',
  },
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['playwright-json-summary-reporter']],
  testMatch: 'landing.spec.ts',
};

export default config;
