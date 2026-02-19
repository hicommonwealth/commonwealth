import { expect, test } from '@playwright/test';
import {
  clearAuth,
  loginWithMockStatus,
  waitForAuthReady,
  waitForSignedOut,
} from '../helpers/auth-helpers';
import {
  goToCommunities,
  goToHome,
  navigateAndWaitForLoad,
  waitForPageReady,
} from '../helpers/navigation-helpers';
import { SELECTORS } from '../helpers/selectors';

test.describe('Authentication flow', () => {
  test.describe('Signed-out state', () => {
    test('@smoke Signed-out user sees sign-in button', async ({ page }) => {
      await goToHome(page);
      await waitForPageReady(page);

      // A signed-out user should see a "Sign in" prompt somewhere on the page
      const signInVisible = await page
        .locator('text="Sign in"')
        .first()
        .isVisible({ timeout: 15_000 })
        .catch(() => false);

      const signInButtonVisible = await page
        .locator(SELECTORS.auth.signInButton)
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      // At least one sign-in indicator should be present
      expect(signInVisible || signInButtonVisible).toBeTruthy();
    });
  });

  test.describe('Authenticated state', () => {
    test.beforeEach(async ({ page }) => {
      // Set up route mocks BEFORE navigating so the mock intercepts the
      // initial getStatus call that fires on page load.
      await loginWithMockStatus(page);
    });

    test('@smoke Authenticated user sees signed-in state', async ({ page }) => {
      await goToHome(page);
      await waitForPageReady(page);

      // Wait for the authenticated UI to appear
      await waitForAuthReady(page);

      // The sign-in button should NOT be present when authenticated
      const signInVisible = await page
        .locator(SELECTORS.auth.signInButton)
        .first()
        .isVisible()
        .catch(() => false);
      expect(signInVisible).toBeFalsy();
    });

    test('Auth state persists across page navigation', async ({ page }) => {
      // Start on the home page
      await goToHome(page);
      await waitForPageReady(page);
      await waitForAuthReady(page);

      // Navigate to communities/explore
      await goToCommunities(page);
      await waitForPageReady(page);

      // Auth state should still be present after navigating
      await waitForAuthReady(page);

      // Navigate back to home
      await goToHome(page);
      await waitForPageReady(page);

      // Auth state should still be present
      await waitForAuthReady(page);
    });

    test('Clearing auth returns to signed-out state', async ({
      page,
      context,
    }) => {
      // Start authenticated
      await goToHome(page);
      await waitForPageReady(page);
      await waitForAuthReady(page);

      // Clear all authentication state
      await clearAuth(page, context);

      // Replace the authenticated mock with an unauthenticated one that
      // returns no user data (null = signed out in the app's logic).
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await page.route(
        '**/api/internal/trpc/user.getStatus**',
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ result: { data: null } }),
          });
        },
      );

      // Reload to trigger a fresh getStatus call with the unauthenticated mock
      await navigateAndWaitForLoad(page, '/');
      await waitForPageReady(page);

      // Should now be in a signed-out state
      await waitForSignedOut(page);
    });
  });
});
