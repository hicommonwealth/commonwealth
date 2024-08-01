import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community profile redirect page', () => {
  testPageCrash('http://localhost:8080/dydx/account/:address');

  testPageCrash('http://localhost:8080/dydx/account');
});
