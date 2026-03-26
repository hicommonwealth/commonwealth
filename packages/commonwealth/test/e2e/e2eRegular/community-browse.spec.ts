import { expect, test } from '@playwright/test';
import { loginWithMockStatus } from '../helpers/auth-helpers';
import { TEST_COMMUNITIES } from '../helpers/fixtures';
import {
  goToCommunities,
  goToCommunity,
  goToHome,
  waitForPageReady,
} from '../helpers/navigation-helpers';
import { SELECTORS } from '../helpers/selectors';

test.describe('Community browsing', () => {
  test('Communities page loads with content', async ({ page }) => {
    await goToCommunities(page);
    await waitForPageReady(page);

    // Page should have visible content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // Verify page title or heading indicates communities
    await expect(
      page.locator('text=/communities|explore/i').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Community page loads without crash', async ({ page }) => {
    // Navigate to a test community (from seeded data)
    await goToCommunity(page, TEST_COMMUNITIES.COMMUNITY_1.id);
    await waitForPageReady(page);

    // Verify we're on the community page
    await expect(page).toHaveURL(new RegExp(TEST_COMMUNITIES.COMMUNITY_1.id));

    // Page should render without crash
    const appError = await page
      .locator(SELECTORS.error.appError)
      .first()
      .isVisible();
    expect(appError).toBeFalsy();
  });

  test('Authenticated user can browse communities', async ({ page }) => {
    await loginWithMockStatus(page);
    await goToCommunities(page);
    await waitForPageReady(page);

    // Authenticated users should see additional community features
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('Navigate from home to community and back', async ({ page }) => {
    // Start at home
    await goToHome(page);
    await waitForPageReady(page);

    // Go to communities
    await goToCommunities(page);
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/communities|\/explore/);

    // Go to a specific community
    await goToCommunity(page, TEST_COMMUNITIES.COMMUNITY_1.id);
    await waitForPageReady(page);
    await expect(page).toHaveURL(new RegExp(TEST_COMMUNITIES.COMMUNITY_1.id));

    // Go back home
    await goToHome(page);
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/$/);
  });

  test('Community page screenshot for manual review', async ({ page }) => {
    await goToCommunity(page, TEST_COMMUNITIES.COMMUNITY_1.id);
    await waitForPageReady(page);

    // Attach screenshot to test artifacts for manual review only — not an
    // automated visual regression check. See test/visual/ for toHaveScreenshot() tests.
    const screenshot = await page.screenshot({ fullPage: false });
    await test.info().attach('community-page-baseline', {
      body: screenshot,
      contentType: 'image/png',
    });
  });
});
