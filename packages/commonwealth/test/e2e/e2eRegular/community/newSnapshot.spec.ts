import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community new snapshot page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/new/snapshot/unsupportedWildCard',
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/new/snapshot-proposal/unsupportedWildCard',
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/new/snapshot-proposals/unsupportedWildCard',
    ),
  );
});
