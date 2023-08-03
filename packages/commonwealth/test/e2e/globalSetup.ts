import { FullConfig } from '@playwright/test';
import { addAddressIfNone } from './utils/e2eUtils';

async function globalSetup(config: FullConfig) {
  await addAddressIfNone('ethereum');
}

export default globalSetup;
