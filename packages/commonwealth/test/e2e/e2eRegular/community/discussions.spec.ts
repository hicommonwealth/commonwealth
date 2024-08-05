import { config } from '@hicommonwealth/core';
import { test } from '@playwright/test';
import { e2eSeeder, type E2E_Seeder } from '../../utils/e2eUtils';
import { testPageCrash } from '../common/testPageCrash';
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
  testPageCrash(
    'http://localhost:8080/dydx/proposal/discussion/non-existant-thread-path',
  );
  testPageCrash('http://localhost:8080/dydx/discussions');
  testPageCrash('http://localhost:8080/dydx/discussions/non-existant-topis');
  testPageCrash(
    'http://localhost:8080/dydx/discussion/non-existant-thread-path',
  );
  testPageCrash('http://localhost:8080/discussion/non-existant-thread-path');

  discussionTests(test);
});
