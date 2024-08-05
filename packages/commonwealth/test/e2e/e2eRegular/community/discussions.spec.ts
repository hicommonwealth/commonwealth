import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { e2eSeeder, type E2E_Seeder } from '../../utils/e2eUtils';
import { generatePageCrashTestConfig } from '../common/testConfigs';
import { discussionTests } from './discussionsTest';

let seeder: E2E_Seeder;

test.beforeAll(async () => {
  seeder = await e2eSeeder();
});

test.beforeEach(async ({ page }) => {
  await page.goto(
    `${config.SERVER_URL}/${seeder.testChains[0].id}/discussions`,
  );
});

test.describe('Test community discussions page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/proposal/discussion/non-existant-thread-path',
    ),
  );
  test(
    ...generatePageCrashTestConfig('http://localhost:8080/dydx/discussions'),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/discussions/non-existant-topis',
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/discussion/non-existant-thread-path',
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/discussion/non-existant-thread-path',
    ),
  );

  discussionTests(test);
});
