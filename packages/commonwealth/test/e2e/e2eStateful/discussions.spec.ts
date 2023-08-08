import { expect, test } from '@playwright/test';

test.describe('test discussion page', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto('http://localhost:8080/dydx/discussions');
  });
  test('assert elements show up on page load', async ({ page }) => {
    await page
      .getByText(
        'All Discussions24 ThreadsCreate ThreadThis section is for the community to discu'
      )
      .click();
    await page.getByText('DiscussionGovernance').click();
    await page.locator('.SidebarQuickSwitcher').click();
  });

  test('assert default threads loaded', async ({ page }) => {
    // Get the count of non-pinned.
    const nonPinnedThreads = await page.$$('.ThreadPreview:not(.isPinned)');

    // Assert that there are 20 threads by default because we haven't scrolled
    expect(nonPinnedThreads.length).toBe(20);
  });

  test('assert reaction button increments', async ({ page }) => {
    const reactionButton = await page.$$('.ThreadPreviewReactionButton');
    const reactionCountElement = await reactionButton[0].$('.reactions-count');

    // Get the initial reaction count
    const initialReactionCount = await reactionCountElement.textContent();

    // Click the reaction button
    await reactionButton[0].click();

    // Get the updated reaction count
    const updatedReactionCount = await reactionCountElement.textContent();

    // Assert that the reaction count has incremented by one
    expect(parseInt(updatedReactionCount)).toBe(
      parseInt(initialReactionCount) + 1
    );
  });
});
