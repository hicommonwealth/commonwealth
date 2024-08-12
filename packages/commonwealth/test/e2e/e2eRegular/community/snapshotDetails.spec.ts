import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community snapshot details page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/snapshot/someNonExistantSnapshotSpace`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/snapshot/someNonExistantSnapshotSpace/some-random-non-existant-address`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/snapshot-proposals/someNonExistantSnapshotSpace`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/snapshot-proposal/someNonExistantSnapshotSpace/some-random-non-existant-address`,
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      `${config.SERVER_URL}/dydx/snapshot-proposals/someNonExistantSnapshotSpace/some-random-non-existant-address`,
    ),
  );
});
