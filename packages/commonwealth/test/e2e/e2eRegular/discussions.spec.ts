import { test } from '@playwright/test';
import { PORT } from '../../../server/config';
import { createTestEntities, testChains } from '../hooks/e2eDbEntityHooks.spec';
import { discussionTests } from './discussionsTest';

test.beforeEach(async ({ page }) => {
  await createTestEntities();
  await page.goto(`http://localhost:${PORT}/${testChains[0].id}/discussions`);
});

test.describe('DiscussionsPage Homepage', discussionTests(test));
