import { BrowserContext, Page, expect } from '@playwright/test';

// Test user IDs from e2eSeeds.ts
export const TEST_USER_IDS = {
  USER_1: -1,
  USER_2: -2,
  USER_3: -3,
  USER_4: -4,
} as const;

/**
 * Authenticate a Playwright page by intercepting the user.getStatus tRPC call
 * and returning a mocked authenticated response for a test user.
 *
 * This is the fastest way to get an authenticated state in E2E tests without
 * going through the full login UI flow.
 */
export async function loginWithMockStatus(
  page: Page,
  options: {
    userId?: number;
    email?: string;
    isAdmin?: boolean;
  } = {},
): Promise<void> {
  const {
    userId = TEST_USER_IDS.USER_1,
    email = 'test-1@gmail.com',
    isAdmin = true,
  } = options;

  // Intercept the getStatus call and return an authenticated response.
  // Response shape must match the tRPC output schema (GetStatus in user.schemas.ts).
  // The JWT value is opaque to the frontend — it only stores and sends it back as
  // an Authorization header. Since we're mocking getStatus, no server-side JWT
  // validation occurs, so a placeholder string is sufficient.
  await page.route('**/api/internal/trpc/user.getStatus**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            id: userId,
            email,
            emailVerified: true,
            isAdmin,
            disableRichText: false,
            emailNotificationInterval: 'never',
            promotional_emails_enabled: false,
            is_welcome_onboard_flow_complete: true,
            selected_community_id: null,
            referred_by_address: null,
            xp_points: 0,
            xp_referrer_points: 0,
            notify_user_name_change: false,
            jwt: 'mock-test-token',
            addresses: [
              {
                id: 1,
                address: '0x834731c87A7a6f8B57F4aa42c205265EAcbFCCD7',
                role: 'admin',
                wallet_id: 'metamask',
                ghost_address: false,
                last_active: null,
                Community: {
                  id: 'cmntest',
                  base: 'ethereum',
                  ss58_prefix: null,
                },
              },
            ],
            communities: [
              {
                id: 'cmntest',
                name: 'cmntest',
                icon_url: '',
                redirect: null,
                created_at: null,
                updated_at: null,
                starred_at: null,
              },
            ],
          },
        },
      }),
    });
  });
}

/**
 * Clear all authentication state — cookies, localStorage, sessionStorage.
 */
export async function clearAuth(
  page: Page,
  context: BrowserContext,
): Promise<void> {
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for the app to reflect an authenticated state.
 * Looks for the user avatar or account menu that appears when logged in.
 */
export async function waitForAuthReady(
  page: Page,
  options: { timeout?: number } = {},
): Promise<void> {
  const { timeout = 15_000 } = options;
  // Wait for the sign-in button to NOT be visible (indicates logged in)
  // or for a user-specific element to appear
  await expect(
    page.locator('[data-testid="user-menu"]').or(page.locator('.AccountMenu')),
  ).toBeVisible({ timeout });
}

/**
 * Wait for the app to reflect a signed-out state.
 */
export async function waitForSignedOut(
  page: Page,
  options: { timeout?: number } = {},
): Promise<void> {
  const { timeout = 15_000 } = options;
  await expect(page.locator('text="Sign in"').first()).toBeVisible({ timeout });
}
