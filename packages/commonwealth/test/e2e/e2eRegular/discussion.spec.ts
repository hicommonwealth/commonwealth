import { test } from '@playwright/test';
import { expect } from 'chai';
import { PORT } from '../../../server/config';
import {
  clearTestEntities,
  createTestEntities,
  testChains,
} from '../../integration/api/external/dbEntityHooks.spec';
import { login, testDb } from '../utils/e2eUtils';

test.beforeEach(async () => {
  await createTestEntities();
});

test.afterEach(async () => {
  await clearTestEntities();
});

test.describe('Discussion Page Tests', () => {
  let threadId;

  test.beforeEach(async ({ page }) => {
    threadId = (
      await testDb.query(`
        INSERT INTO "Threads" (address_id, title, body, chain, topic_id, kind, created_at, updated_at)
        VALUES (-1, 'Example Title', 'Example Body', 'cmntest', -1, 'discussion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id;
    `)
    )[0][0]['id'];

    await page.goto(
      `http://localhost:${PORT}/${testChains[0].id}/discussion/${threadId}`
    );
    await login(page, testChains[0].id);
  });

  test('Check User can create/update/delete comment', async ({ page }) => {
    let time = Date.now();

    let textBox;
    do {
      textBox = await page.$('.ql-editor');
    } while (!textBox);
    let commentText = `test comment made at ${time}`;
    await textBox.fill(commentText);

    await page.getByRole('button', { name: 'Submit' }).click();

    // asserts that comment is created
    await page.getByText(commentText);

    // The 3 dots below the comment doesn't have a clear unique identifier.
    let commentOptionButton = await page.locator('.comment-option-btn', {
      has: page.locator('svg.Icon.small'),
    });
    await commentOptionButton.nth(2).click();

    await page.locator('div', { hasText: 'Edit' }).click();

    time = Date.now();

    textBox = await page.$('.ql-editor');
    commentText = `test comment updated at ${time}`;
    await textBox.fill(commentText);

    await page.getByRole('button', { name: 'Save' }).click();

    // asserts that comment is created
    await page.getByText(commentText);

    commentOptionButton = await page.locator('.comment-option-btn');
    await commentOptionButton.first().click();

    await page.locator('div', { hasText: 'Delete' }).click();

    await expect(page).not.to.have.text('div', commentText);
  });

  // test('Check User can like/dislike thread', async ({ page }) => {
  //   await page.locator('.CommentReactionButton').first().click();
  // });
  //
  // test('Check User can like/dislike comment in thread', async ({ page }) => {});
});
