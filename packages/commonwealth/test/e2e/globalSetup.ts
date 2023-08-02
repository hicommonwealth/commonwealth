import { FullConfig } from '@playwright/test';
import { addUserIfNone } from './utils/e2eUtils';

async function globalSetup(config: FullConfig) {
  await addUserIfNone('ethereum');
}

export default globalSetup;
