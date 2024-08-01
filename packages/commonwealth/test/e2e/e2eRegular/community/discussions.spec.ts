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
  testPageCrash('http://localhost:8080/dydx/proposal/discussion/:identifier');

  testPageCrash('http://localhost:8080/dydx/discussions');

  testPageCrash('http://localhost:8080/dydx/discussions/:topicName');

  testPageCrash('http://localhost:8080/dydx/discussion/:identifier');

  testPageCrash('http://localhost:8080/discussion/:identifier');

  discussionTests(test);
});
