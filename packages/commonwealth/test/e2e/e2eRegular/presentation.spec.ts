import { expect, test } from '@playwright/test';
import { PORT } from '../../../server/config';
import { createTestEntities, testChains } from '../hooks/e2eDbEntityHooks';

test.describe('Discussion Page Tests', () => {
  test('Check User can create/update/delete/like/unlike comment',
    async ({ page }) => {
      await createTestEntities();

      await page.goto(
        `http://localhost:${PORT}/${testChains[0].id}/discussions`
      );

      const firstThread = page.locator('.ThreadCard').first();
      await firstThread.click();
      const threadTitle = page.locator('.title');
      await expect(threadTitle).toHaveText('testThread Title 1004!')
    });
});
