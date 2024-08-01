import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test dashboard page', () => {
  testPageCrash(`http://localhost:8080/dashboard`);

  testPageCrash(`http://localhost:8080/dashboard/for-you`);

  testPageCrash(`http://localhost:8080/dashboard/global`);
});
