import { expect as pwexpect } from '@playwright/test';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { testThreads } from '../hooks/e2eDbEntityHooks.spec';
import { login } from '../utils/e2eUtils';

chai.use(chaiHttp);
const { expect } = chai;

export const discussionTests = (test) => {
  return () => {
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
      await pwexpect(async () => {
        const numberOfThreads = await page.$$eval(
          'div[data-test-id] > div',
          (divs) => divs.length,
        );
        expect(numberOfThreads).to.be.gte(testThreads.length - 1);
      }).toPass();

      const firstThread = await page.$(
        'div[data-test-id="virtuoso-item-list"] > div:first-child',
      );

      // navigate to first link
      await firstThread.click();

      expect(page.url())
        .to.include('discussion')
        .and.not.include('discussions');
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

      let reactionsCountDivs = await page.locator('div.reactions-count');

      await pwexpect(async () => {
        reactionsCountDivs = await page.locator('div.reactions-count');
        await pwexpect(reactionsCountDivs.first()).toBeVisible();
      }).toPass();

      const firstThreadReactionCount = await reactionsCountDivs
        .first()
        .innerText();

      // click button
      await page
        .getByRole('button', { name: firstThreadReactionCount, exact: true })
        .first()
        .click();

      const expectedNewReactionCount = (
        parseInt(firstThreadReactionCount) + 1
      ).toString();
      // assert reaction count increased
      await pwexpect(async () => {
        reactionsCountDivs = await page.locator('.reactions-count');
        pwexpect(await reactionsCountDivs.first().innerText()).toEqual(
          expectedNewReactionCount,
        );
      }).toPass({ timeout: 5_000 });

      // click button
      await page
        .getByRole('button', { name: expectedNewReactionCount, exact: true })
        .first()
        .click();

      // assert reaction count decreased
      await pwexpect(async () => {
        reactionsCountDivs = await page.locator('.reactions-count');
        pwexpect(await reactionsCountDivs.first().innerText()).toEqual(
          firstThreadReactionCount,
        );
      }).toPass({ timeout: 5_000 });
    });

    // test('Check User can interact with polls', async ({
    //   page,
    // }: {
    //   page: Page;
    // }) => {
    //   const threadId = (
    //     await testDb.query(`
    //     INSERT INTO "Threads" (address_id, title, body, community_id, topic_id, kind, created_at, updated_at)
    //     VALUES (-1, 'Example Title', 'Example Body', 'cmntest', -1, 'discussion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    //     RETURNING id;
    // `)
    //   )[0][0]['id'];

    //   await page.goto(
    //     `http://localhost:${PORT}/${testChains[0].id}/discussion/${threadId}`
    //   );
    //   await login(page);

    //   const createPollButtonSelector = 'div.create-poll-button';
    //   await page.waitForSelector(createPollButtonSelector);
    //   await page.click(createPollButtonSelector);

    //   await page.waitForSelector('#QuestionInput');
    //   await page.type('#QuestionInput', 'my question?');
    //   await page.type('input[placeholder="1."]', 'q1');
    //   await page.type('input[placeholder="2."]', 'q2');
    // });
  };
};
