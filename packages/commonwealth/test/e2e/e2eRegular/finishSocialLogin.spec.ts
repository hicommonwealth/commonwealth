import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test finish social login page', () => {
  test(
    ...generatePageCrashTestConfig(`${config.SERVER_URL}/finishsociallogin`),
  );
});
