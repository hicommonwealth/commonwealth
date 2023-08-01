import { test } from '@playwright/test';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { PORT } from '../../../server/config';
import {
  clearTestEntities,
  createTestEntities,
  testChains,
  testThreads,
} from '../../integration/api/external/dbEntityHooks.spec';
import { login } from '../utils/e2eUtils';

chai.use(chaiHttp);
const { expect } = chai;

test.beforeEach(async () => {
  await createTestEntities();
});

test.afterEach(async () => {
  await clearTestEntities();
});

test.describe('DiscussionsPage Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/${testChains[0].id}/discussions`);
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
    expect(numberOfThreads).to.equal(Math.min(20, testThreads.length));

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

    let reactionsCountDivs = await page.$$('.reactions-count');
    const firstThreadReactionCount = reactionsCountDivs[0].innerText();

    // click button
    await page.getByRole('button', { name: '0', exact: true }).first().click();

    reactionsCountDivs = await page.$$('.reactions-count');
    console.log(await reactionsCountDivs[0].innerText());
    chai.assert.equal(
      await reactionsCountDivs[0].innerText(),
      (await firstThreadReactionCount) + 1,
      'reaction count did not increase after clicked'
    );

    // click button
    await page.getByRole('button', { name: '1', exact: true }).first().click();

    reactionsCountDivs = await page.$$('.reactions-count');
    chai.assert.equal(
      await reactionsCountDivs[0].innerText(),
      await firstThreadReactionCount,
      'reaction count did not decrease after clicked'
    );
  });
});
