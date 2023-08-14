import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    video: 'retain-on-failure',
  },
  globalSetup: './globalSetup.ts',
  timeout: 45_000,
};

export default config;
