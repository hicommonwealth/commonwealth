import { expect, test } from '@playwright/test';

test.describe('Component Showcase Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('load');
  });

  test('full showcase page renders @visual', async ({ page }) => {
    // Wait for at least one component section heading to be visible
    await page
      .locator('text=Foundations')
      .first()
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('showcase-full-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('foundations section renders @visual', async ({ page }) => {
    const foundations = page.locator('text=Foundations').first();
    await foundations.waitFor({ state: 'visible' });
    await foundations.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-foundations.png');
  });

  test('buttons section renders @visual', async ({ page }) => {
    const buttons = page.locator('text=Buttons').first();
    await buttons.waitFor({ state: 'visible' });
    await buttons.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-buttons.png');
  });

  test('inputs section renders @visual', async ({ page }) => {
    const inputs = page.locator('text=Inputs').first();
    await inputs.waitFor({ state: 'visible' });
    await inputs.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-inputs.png');
  });

  test('avatars section renders @visual', async ({ page }) => {
    const avatars = page.locator('text=Avatars').first();
    await avatars.waitFor({ state: 'visible' });
    await avatars.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-avatars.png');
  });

  test('banners and alerts section renders @visual', async ({ page }) => {
    const banners = page.locator('text=Banners').first();
    await banners.waitFor({ state: 'visible' });
    await banners.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-banners.png');
  });

  test('dropdowns section renders @visual', async ({ page }) => {
    const dropdowns = page.locator('text=Dropdowns').first();
    await dropdowns.waitFor({ state: 'visible' });
    await dropdowns.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-dropdowns.png');
  });

  test('cards section renders @visual', async ({ page }) => {
    const cards = page.locator('text=Cards').first();
    await cards.waitFor({ state: 'visible' });
    await cards.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot('showcase-cards.png');
  });
});
