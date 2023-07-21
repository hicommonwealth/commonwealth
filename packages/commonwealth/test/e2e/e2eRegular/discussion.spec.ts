import { test } from '@playwright/test';
import { expect } from 'chai';
import { PORT } from '../../../server/config';
import {
  clearTestEntities,
  createTestEntities,
  testChains,
} from '../../integration/api/external/dbEntityHooks.spec';
import { login } from '../utils/e2eUtils';

test.beforeEach(async () => {
  await createTestEntities();
});

test.afterEach(async () => {
  await clearTestEntities();
});

test.describe('Discussion Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `http://localhost:${PORT}/${testChains[0].id}/discussion/-5-`
    );
    await login(page);
  });

  test('Check User can create/update/delete comment', async ({ page }) => {
    let time = Date.now();

    let textBox = await page.$('.ql-editor');
    let commentText = `test comment made at ${time}`;
    await textBox.fill(commentText);

    await page.getByRole('button', { name: 'Submit' }).click();

    // asserts that comment is created
    await page.getByText(commentText);

    let commentOptionButton = await page.locator('.comment-option-btn');
    await commentOptionButton.first().click();

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

  test('Check User can like/dislike thread', async ({ page }) => {
    await page.locator('.CommentReactionButton').first().click();
  });

  test('Check User can like/dislike comment in thread', async ({ page }) => {});
});
