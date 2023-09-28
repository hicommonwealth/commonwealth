import { expect, test } from '@playwright/test';
import { createTestEntities, testChains } from '../hooks/e2eDbEntityHooks';
import { discussionTests } from './discussionsTest';

if (process.env.IS_CI === 'true') {
  // ssl proxy takes a while, so increase test timeout
  test.setTimeout(300000);

  test.beforeAll(async () => {
    await createTestEntities();
  });

  test.beforeEach(async ({ page }) => {
    // proxy can be slow to start up, so we wait for it.
    await expect(async () => {
      await page.goto(`https://${testChains[0]['custom_domain']}/`);
    }).toPass({ intervals: [60_000] });
  });
  test.describe('Commonwealth custom domain Homepage', discussionTests(test));
} else {
  test.skip('Skipping tests in local environment', () => {});
}
