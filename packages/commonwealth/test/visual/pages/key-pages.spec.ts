import { expect, test } from '@playwright/test';
import { loginWithMockStatus } from '../../e2e/helpers/auth-helpers';

test.describe('Key Pages Visual Regression', () => {
  test('home page (signed out) @visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.locator('body').waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('home-signed-out.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('home page (authenticated) @visual', async ({ page }) => {
    await loginWithMockStatus(page);

    await page.goto('/');
    await page.waitForLoadState('load');
    await page.locator('body').waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('home-authenticated.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
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
