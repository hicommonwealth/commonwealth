import { expect, test, type Page } from '@playwright/test';
import { loginWithMockStatus } from '../../e2e/helpers/auth-helpers';

// After intentional UI changes, refresh linux baselines via the
// "Visual Baseline Update" workflow (workflow_dispatch) and commit the updated snapshots.

test.describe('Key Pages Visual Regression', () => {
  async function waitForHomePageContent(page: Page) {
    await page.waitForLoadState('load');
    await page.locator('body').waitFor({ state: 'visible' });
    // Wait for main content so the screenshot is stable (home has dynamic lists).
    await page.locator('text=Trending').first().waitFor({ state: 'visible' });
  }

  test('home page (signed out) @visual', async ({ page }) => {
    await page.goto('/');
    await waitForHomePageContent(page);
    await expect(page).toHaveScreenshot('home-signed-out.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('home page (authenticated) @visual', async ({ page }) => {
    await loginWithMockStatus(page);

    await page.goto('/');
    await waitForHomePageContent(page);
    await expect(page).toHaveScreenshot('home-authenticated.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('communities page @visual', async ({ page }) => {
    await page.goto('/communities');
    await page.waitForLoadState('load');
    await page.locator('body').waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('communities-page.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('components showcase page @visual', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('load');
    await page.locator('body').waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('components-showcase.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
