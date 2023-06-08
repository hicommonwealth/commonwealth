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
  test('Check Discussion page loads', async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/${testChains[0].id}/discussions`);

    await page.waitForSelector('div.RecentThreadsHeader');

    // Assert Thread header exists on discussions page
    const divExists = (await page.$('div.RecentThreadsHeader')) !== null;

    expect(divExists).to.be.true;

    // Assert Threads are loaded into page
    await page.waitForSelector('div[data-test-id]');

    // Perform the assertion
    const childDivCount = await page.$$eval(
      'div[data-test-id] > div',
      (divs) => divs.length
    );
    expect(childDivCount).to.equal(Math.min(20, testThreads.length + 1));
  });
});
