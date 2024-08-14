import {
  expect,
  PlaywrightTestArgs,
  PlaywrightTestConfig,
} from '@playwright/test';

export const generatePageCrashTestConfig = (
  url = '',
): [
  string,
  (
    args: PlaywrightTestArgs,
    testInfo: PlaywrightTestConfig,
  ) => Promise<void> | void,
] => {
  return [
    `page renders successfully without crashes ${url}`,
    async ({ page }) => {
      await page.goto(url);
      const appError = await page
        .locator('div[data-testid="app-error"]')
        .first()
        .isVisible();
      expect(appError).toBeFalsy();
    },
  ];
};
