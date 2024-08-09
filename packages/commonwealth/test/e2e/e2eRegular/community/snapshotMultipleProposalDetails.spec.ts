import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community snapshot multiple proposal details page', () => {
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/multiple-snapshots`,
    ),
  );
});
