import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test admin panel page', () => {
  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/admin-panel`));
});
