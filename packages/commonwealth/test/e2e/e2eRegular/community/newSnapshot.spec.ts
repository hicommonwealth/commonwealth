import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community new snapshot page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/new/snapshot/unsupportedWildCard`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/new/snapshot-proposal/unsupportedWildCard`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/new/snapshot-proposals/unsupportedWildCard`,
    ),
  );
});
