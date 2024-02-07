import { FullConfig } from '@playwright/test';
import { clearTestEntities } from './hooks/e2eDbEntityHooks.spec';

async function globalTeardown(config: FullConfig) {
  await clearTestEntities();
}

export default globalTeardown;
