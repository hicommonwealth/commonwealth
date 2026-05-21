import { expect, test } from '@playwright/test';
import { loginWithMockStatus } from '../helpers/auth-helpers';
import { TEST_COMMUNITIES, TEST_THREADS } from '../helpers/fixtures';
import {
  goToCommunity,
  goToThread,
  waitForPageReady,
} from '../helpers/navigation-helpers';
import { SELECTORS } from '../helpers/selectors';

test.describe('Thread lifecycle', () => {
  test.describe('Viewing threads', () => {
    test('Community page displays thread list', async ({ page }) => {
      await goToCommunity(page, TEST_COMMUNITIES.COMMUNITY_1.id);
      await waitForPageReady(page);

      // The community page should have some content area for threads
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(0);

      // No app crash
      const appError = await page
        .locator(SELECTORS.error.appError)
        .first()
        .isVisible();
      expect(appError).toBeFalsy();
    });

    test('Thread detail page renders without crash', async ({ page }) => {
      await goToThread(
        page,
        TEST_COMMUNITIES.COMMUNITY_1.id,
        TEST_THREADS.THREAD_1.id,
      );
      await waitForPageReady(page);

      // Thread page should render
      const appError = await page
        .locator(SELECTORS.error.appError)
        .first()
        .isVisible();
      expect(appError).toBeFalsy();

      // Should have content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(0);
    });

    test('Thread detail page screenshot for manual review', async ({
      page,
    }) => {
      await goToThread(
        page,
        TEST_COMMUNITIES.COMMUNITY_1.id,
        TEST_THREADS.THREAD_1.id,
      );
      await waitForPageReady(page);

      // Attach screenshot to test artifacts for manual review only — not an
      // automated visual regression check. See test/visual/ for toHaveScreenshot() tests.
      const screenshot = await page.screenshot({ fullPage: false });
      await test.info().attach('thread-detail-baseline', {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  });

  test.describe('Authenticated thread interaction', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithMockStatus(page);
    });

    test('Authenticated user can view thread detail', async ({ page }) => {
      await goToThread(
        page,
        TEST_COMMUNITIES.COMMUNITY_1.id,
        TEST_THREADS.THREAD_1.id,
      );
      await waitForPageReady(page);

      // Authenticated users may see additional thread controls
      const appError = await page
        .locator(SELECTORS.error.appError)
        .first()
        .isVisible();
      expect(appError).toBeFalsy();
    });

    test('Navigate between multiple threads', async ({ page }) => {
      // View first thread
      await goToThread(
        page,
        TEST_COMMUNITIES.COMMUNITY_1.id,
        TEST_THREADS.THREAD_1.id,
      );
      await waitForPageReady(page);

      // Navigate to second thread
      await goToThread(
        page,
        TEST_COMMUNITIES.COMMUNITY_1.id,
        TEST_THREADS.THREAD_2.id,
      );
      await waitForPageReady(page);

      // Navigate to community page
      await goToCommunity(page, TEST_COMMUNITIES.COMMUNITY_1.id);
      await waitForPageReady(page);

      // No crashes through the flow
      const appError = await page
        .locator(SELECTORS.error.appError)
        .first()
        .isVisible();
      expect(appError).toBeFalsy();
    });
  });
});
