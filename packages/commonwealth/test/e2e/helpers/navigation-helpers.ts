import { Page, expect } from '@playwright/test';
import { SELECTORS } from './selectors';

/**
 * Navigate to a page and wait for the app shell to load without errors.
 * Uses Playwright's baseURL from the config, so paths should be relative (e.g. '/').
 */
export async function navigateAndWaitForLoad(
  page: Page,
  path: string,
  options: { timeout?: number } = {},
): Promise<void> {
  const { timeout = 30_000 } = options;
  await page.goto(path, { waitUntil: 'load', timeout });

  // Verify no app crash
  const appError = await page
    .locator(SELECTORS.error.appError)
    .first()
    .isVisible();
  expect(appError).toBeFalsy();
}

/**
 * Navigate to the home page.
 */
export async function goToHome(page: Page): Promise<void> {
  await navigateAndWaitForLoad(page, '/');
}

/**
 * Navigate to the dashboard/explore page.
 */
export async function goToExplore(page: Page): Promise<void> {
  await navigateAndWaitForLoad(page, '/dashboard/for-you');
}

/**
 * Navigate to the communities page.
 */
export async function goToCommunities(page: Page): Promise<void> {
  await navigateAndWaitForLoad(page, '/communities');
}

/**
 * Navigate to a specific community page.
 */
export async function goToCommunity(
  page: Page,
  communitySlug: string,
): Promise<void> {
  await navigateAndWaitForLoad(page, `/${communitySlug}`);
}

/**
 * Navigate to a specific thread.
 */
export async function goToThread(
  page: Page,
  communitySlug: string,
  threadId: number,
): Promise<void> {
  await navigateAndWaitForLoad(
    page,
    `/${communitySlug}/discussion/${threadId}`,
  );
}

/**
 * Navigate to the components showcase page.
 */
export async function goToComponentsShowcase(page: Page): Promise<void> {
  await navigateAndWaitForLoad(page, '/components');
}

/**
 * Navigate to user profile.
 */
export async function goToProfile(page: Page, userId: number): Promise<void> {
  await navigateAndWaitForLoad(page, `/profile/id/${userId}`);
}

/**
 * Wait for the page to be fully loaded and verify no app crash.
 * Uses 'domcontentloaded' rather than 'networkidle' to avoid flakiness
 * from long-polling, analytics, or websocket connections.
 */
export async function waitForPageReady(
  page: Page,
  options: { timeout?: number } = {},
): Promise<void> {
  const { timeout = 15_000 } = options;
  await page.waitForLoadState('domcontentloaded', { timeout });
  // Verify no app crash
  const appError = await page
    .locator(SELECTORS.error.appError)
    .first()
    .isVisible();
  expect(appError).toBeFalsy();
}
