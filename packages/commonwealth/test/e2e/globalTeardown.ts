import { FullConfig } from '@playwright/test';
import { pgContainer } from './globalSetup';

async function globalTeardown(config: FullConfig) {
  await pgContainer.stop();
}

export default globalTeardown;
