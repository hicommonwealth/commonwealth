import { expect, test } from '@playwright/test';
import chaiHttp from 'chai-http';
import { PORT } from '../../../server/config';
import {
  clearTestEntities,
  createTestEntities,
  testChains,
  testThreads,
} from '../hooks/e2eDbEntityHooks.spec';
import { login } from '../utils/e2eUtils';

test.describe('DiscussionsPage Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await createTestEntities();
    await page.goto(`http://localhost:${PORT}/${testChains[0].id}/discussions`);
  });

  test.afterEach(async () => {
    await clearTestEntities();
  });

  test('Discussion page loads and can navigate to first thread', async ({
    page,
  }) => {
    await page.waitForSelector('div.HeaderWithFilters');

    // Assert Thread header exists on discussions page
    const headerExists = (await page.$('div.HeaderWithFilters')) !== null;

    expect(headerExists).to.be.true;

    // Assert Threads are loaded into page
    await page.waitForSelector('div[data-test-id]');

    // Perform the assertion
    const numberOfThreads = await page.$$eval(
      'div[data-test-id] > div',
      (divs) => divs.length
    );
    expect(numberOfThreads).to.be.gte(testThreads.length - 1);

    const firstThread = await page.$(
      'div[data-test-id="virtuoso-item-list"] > div:first-child'
    );

    // navigate to first link
    await firstThread.click();

    expect(page.url()).to.include('discussion').and.not.include('discussions');
  });

  test('Check navigation to first profile', async ({ page }) => {
    let userProfileLinks = await page.locator('a.user-display-name.username');

    do {
      userProfileLinks = await page.locator('a.user-display-name.username');
    } while (!(await userProfileLinks.first().getAttribute('href')));

    // navigate to first link
    await userProfileLinks.first().click();

    expect(page.url()).to.include('/profile/id/');
  });

  test('Check User can Like/Dislike post', async ({ page }) => {
    await login(page);

    let reactionsCountDivs = await page.locator('.reactions-count');

    do {
      reactionsCountDivs = await page.locator('.reactions-count');
    } while (!reactionsCountDivs[0]);

    const firstThreadReactionCount = reactionsCountDivs[0].innerText();

    // click button
    await page.getByRole('button', { name: '0', exact: true }).first().click();

    // assert reaction count increased
    await expect(async () => {
      reactionsCountDivs = await page.locator('.reactions-count');
      expect(await reactionsCountDivs[0].innerText()).toEqual(
        (await firstThreadReactionCount) + 1
      );
    }).toPass();

    // click button
    await page.getByRole('button', { name: '1', exact: true }).first().click();

    // assert reaction count decreased
    await expect(async () => {
      reactionsCountDivs = await page.locator('.reactions-count');
      expect(await reactionsCountDivs[0].innerText()).toEqual(
        await firstThreadReactionCount
      );
    }).toPass();
  });
});
