import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test view profile page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/profile/id/12345`));
});
