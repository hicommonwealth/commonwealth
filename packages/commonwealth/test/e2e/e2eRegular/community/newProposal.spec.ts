import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community new proposal page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/cosmos/new/proposal/communitySpend`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/cosmos/new/proposal/textProposal`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/cosmos/new/proposal/unsupportedWildCard`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(`${config.SERVER_URL}/cosmos/new/proposal`),
  );
});
