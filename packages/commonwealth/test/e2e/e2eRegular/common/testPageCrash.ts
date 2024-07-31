import { expect, test } from '@playwright/test';

export const testPageCrash = (url = '') => {
  return test('page renders successfully without crashes', async ({ page }) => {
    await page.goto(url);
    const appError = await page
      .locator('div[data-testid="app-error"]')
      .first()
      .isVisible();
    expect(appError).toBeFalsy();
  });
};
