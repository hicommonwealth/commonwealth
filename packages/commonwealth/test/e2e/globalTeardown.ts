import { FullConfig } from '@playwright/test';
import { dbClient, pgContainer } from './globalSetup';

async function globalTeardown(config: FullConfig) {
  await dbClient.end();
  await pgContainer.stop();
}

export default globalTeardown;
