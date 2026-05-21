import { expect, test } from '@playwright/test';
import {
  goToCommunities,
  goToHome,
  navigateAndWaitForLoad,
  waitForPageReady,
} from '../helpers/navigation-helpers';
import { SELECTORS } from '../helpers/selectors';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await goToHome(page);
  });

  test('@smoke Home page renders without crashes', async ({ page }) => {
    // The goToHome helper already asserts no app-error is visible.
    // Re-verify explicitly for clarity.
    const appError = await page
      .locator(SELECTORS.error.appError)
      .first()
      .isVisible();
    expect(appError).toBeFalsy();
  });

  test('@smoke Home page has visible content', async ({ page }) => {
    await waitForPageReady(page);

    // The page should have a body with at least some visible text content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // Verify the page title is set (not blank or the default fallback)
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Navigation from home to communities/explore works', async ({
    page,
  }) => {
    // Navigate to communities/explore page from the home page context
    await goToCommunities(page);

    // Verify we landed on the explore page
    await expect(page).toHaveURL(/\/communities|\/explore/);

    // Verify no crash on the destination page
    const appError = await page
      .locator(SELECTORS.error.appError)
      .first()
      .isVisible();
    expect(appError).toBeFalsy();
  });

  test('Home page screenshot capture for visual baseline', async ({ page }) => {
    await waitForPageReady(page);

    // Also verify the /home alias works without crashes
    await navigateAndWaitForLoad(page, '/home');
    await waitForPageReady(page);

    // Attach screenshot to test artifacts for manual review only — not an
    // automated visual regression check. See test/visual/ for toHaveScreenshot() tests.
    const screenshot = await page.screenshot({ fullPage: true });
    await test.info().attach('home-page-baseline', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Screenshot captured successfully — no crash on either route
    const appError = await page
      .locator(SELECTORS.error.appError)
      .first()
      .isVisible();
    expect(appError).toBeFalsy();
  });
});
