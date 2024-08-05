import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community search page', () => {
  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/dydx/search`));
});
