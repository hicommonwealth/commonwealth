import { expect, test } from '@playwright/test';
import { createTestEntities, testChains } from '../hooks/e2eDbEntityHooks.spec';
import { addAlchemyKey } from '../utils/e2eUtils';
import { discussionTests } from './discussionsTest';

// ssl proxy takes a while, so increase test timeout
test.setTimeout(220000);

test.use({ ignoreHTTPSErrors: true });

test.beforeAll(async () => {
  await createTestEntities();
});

test.beforeEach(async ({ page }) => {
  // proxy can be slow to start up, so we wait for it.
  await expect(async () => {
    await page.goto(`https://${testChains[0]['custom_domain']}/`);
  }).toPass();
});

test.describe('Commonwealth custom domain Homepage', discussionTests(test));
