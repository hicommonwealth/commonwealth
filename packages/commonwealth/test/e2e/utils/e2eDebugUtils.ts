import { chromium, TestInfo } from '@playwright/test';
import { Page } from 'playwright-test';

export async function screenshotOnFailure(
  { page }: { page: Page },
  testInfo: TestInfo
) {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Get a unique place for the screenshot.
    const screenshotPath = testInfo.outputPath(`failure.png`);
    // Add it to the report.
    testInfo.attachments.push({
      name: 'screenshot',
      path: screenshotPath,
      contentType: 'image/png',
    });
    // Take the screenshot itself.
    await page.screenshot({ path: screenshotPath, timeout: 5000 });
  }
}
