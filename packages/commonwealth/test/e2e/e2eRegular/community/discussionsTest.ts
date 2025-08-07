import { expect as pwexpect } from '@playwright/test';
import { login } from '../../utils/e2eUtils';

export const discussionTests = (test) => {
  return () => {
    test.skip('Discussion page loads and can navigate to first thread', async ({
      page,
    }) => {
      await page.waitForSelector('div.HeaderWithFilters');

      // Assert Thread header exists on discussions page
      const headerExists = (await page.$('div.HeaderWithFilters')) !== null;
      pwexpect(headerExists).toBe(true);

      // Assert Threads are loaded into page
      await page.waitForSelector('div[data-test-id]');

      // Perform the assertion
      await pwexpect(async () => {
        const numberOfThreads = await page.$$eval(
          'div[data-test-id] > div',
          (divs) => divs.length,
        );
        pwexpect(numberOfThreads).toBeGreaterThanOrEqual(0);
      }).toPass();

      const firstThread = await page.$(
        'div[data-test-id="virtuoso-item-list"] > div:first-child',
      );

      // navigate to first link
      await firstThread.click();

      pwexpect(page.url()).toContain('discussion');
      pwexpect(page.url()).not.toContain('discussions');
    });

    test('Check navigation to first profile', async ({ page }) => {
      let userProfileLinks = await page.locator('a.user-display-name.username');

      do {
        userProfileLinks = await page.locator('a.user-display-name.username');
      } while (!(await userProfileLinks.first().getAttribute('href')));

      // navigate to first link
      await userProfileLinks.first().click();

      pwexpect(page.url()).toContain('/profile/id/');
    });

    test.skip('Check User can Like/Dislike post', async ({ page }) => {
      await login(page);

      let reactionsCountDivs = await page.locator('div.reactions-count');

      await pwexpect(async () => {
        reactionsCountDivs = await page
          .locator('.Upvote')
          .first()
          .locator('.Text');
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
        reactionsCountDivs = await page
          .locator('.Upvote')
          .first()
          .locator('.Text');
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
        reactionsCountDivs = await page
          .locator('.Upvote')
          .first()
          .locator('.Text');
        pwexpect(await reactionsCountDivs.first().innerText()).toEqual(
          firstThreadReactionCount,
        );
      }).toPass({ timeout: 5_000 });
    });
  };
};
