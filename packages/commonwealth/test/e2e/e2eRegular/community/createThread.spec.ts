import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community create thread page', () => {
  testPageCrash('http://localhost:8080/dydx/new/discussion');
});
