import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { e2eSeeder, type E2E_Seeder } from '../utils/e2eUtils';
import { discussionTests } from './discussionsTest';

let seeder: E2E_Seeder;

test.beforeAll(async () => {
  seeder = await e2eSeeder();
});

test.beforeEach(async ({ page }) => {
  await page.goto(
    `${config.SERVER_URL}/${seeder.testChains[0].id}/discussions`,
  );
});

test.describe('DiscussionsPage Homepage', discussionTests(test));
