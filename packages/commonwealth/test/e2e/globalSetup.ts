import { FullConfig } from '@playwright/test';
import { createInitialUser } from './utils/e2eUtils';

async function globalSetup(config: FullConfig) {
  await createInitialUser();
}

export default globalSetup;
