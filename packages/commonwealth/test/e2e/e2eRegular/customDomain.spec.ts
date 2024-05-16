import { expect, test } from '@playwright/test';
import { e2eSeeder, type E2E_Seeder } from '../utils/e2eUtils';

let seeder: E2E_Seeder;

test.beforeAll(async () => {
  seeder = await e2eSeeder();
});

if (process.env.IS_CI === 'true') {
  // ssl proxy takes a while, so increase test timeout
  test.setTimeout(200000);

  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(async ({ page }) => {
    // proxy can be slow to start up, so we wait for it.
    await expect(async () => {
      await page.goto(`https://${seeder.testChains[0]['custom_domain']}/`);
    }).toPass({ intervals: [20_000] });
  });
} else {
  test.skip('Skipping tests in local environment', () => {});
}
