import { test } from '@playwright/test';
import { PORT } from '../../../server/config';
import { e2eSeeder, login, type E2E_Seeder } from '../utils/e2eUtils';

let seeder: E2E_Seeder;

test.beforeAll(async () => {
  seeder = await e2eSeeder();
});

test.describe('New Discussion Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `http://localhost:${PORT}/${seeder.testChains[0].id}/discussions`,
    );
    await seeder.addAddressIfNone(seeder.testChains[0].id);
    await login(page);
    await page.goto(
      `http://localhost:${PORT}/${seeder.testChains[0].id}/new/discussion`,
    );
  });

  test('Check User can create a thread', async ({ page }) => {
    await page.locator('#undefinedInput').fill('Test thread');
    await page.locator('.ql-editor').fill('Test thread text');
    await page.locator('.SelectList').click();
    await page.getByText('testTopic', { exact: true }).click();

    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForURL(/^.*-test-thread$/i);

    // delete thread for cleanup
    const match = page.url().match(/\/(\d+)-/);
    const threadId = match[1];
    await seeder.testDb.sequelize.query(
      `DELETE from "Threads" where id = ${threadId}`,
    );
  });
});
