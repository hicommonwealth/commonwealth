import { test } from '@playwright/test';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { PORT } from '../../server/config';
import {
  clearTestEntities,
  createTestEntities,
  testChains,
  testThreads,
} from '../integration/api/external/dbEntityHooks.spec';
chai.use(chaiHttp);
const { expect } = chai;

test.beforeEach(async () => {
  await createTestEntities();
});

test.afterEach(async () => {
  await clearTestEntities();
});

test.describe('DiscussionsPage Homepage', () => {
  test('Discussion page loads and can navigate to first thread', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${PORT}/${testChains[0].id}/discussions`);

    await page.waitForSelector('div.RecentThreadsHeader');

    // Assert Thread header exists on discussions page
    const headerExists = (await page.$('div.RecentThreadsHeader')) !== null;

    expect(headerExists).to.be.true;

    // Assert Threads are loaded into page
    await page.waitForSelector('div[data-test-id]');

    // Perform the assertion
    const numberOfThreads = await page.$$eval(
      'div[data-test-id] > div',
      (divs) => divs.length
    );
    expect(numberOfThreads).to.equal(Math.min(20, testThreads.length + 1));

    const firstThread = await page.$(
      'div[data-test-id="virtuoso-item-list"] > div:first-child'
    );

    // navigate to first link
    await firstThread.click();

    expect(page.url()).to.include('discussion').and.not.include('discussions');
  });

  test('Check navigation to first profile', async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/${testChains[0].id}/discussions`);

    let userProfileLinks = await page.locator('a.user-display-name.username');

    do {
      userProfileLinks = await page.locator('a.user-display-name.username');
    } while (!(await userProfileLinks.first().getAttribute('href')));

    // navigate to first link
    await userProfileLinks.first().click();

    expect(page.url()).to.include('/profile/id/');
  });
});
