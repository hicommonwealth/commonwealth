import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community profile redirect page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/account/0x5809785C6c45553feFB8891A5AAAAAEe71e6cFED`,
    ),
  );
  test(...generatePageCrashTestConfig(`${config.SERVER_URL}/dydx/account`));
});
