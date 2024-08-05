import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community proposal details page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/proposal/communitySpend/123456-some-random-text`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/proposal/123456-some-random-text`,
    ),
  );
});
