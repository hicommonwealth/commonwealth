import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test dashboard page', () => {
  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/dashboard`));

  test(
    ...generatePageCrashTestConfig(`${config.SERVER_URL}/dashboard/for-you`),
  );

  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/dashboard/global`));
});
