import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test home page', () => {
  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/`));

  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/home`));
});
