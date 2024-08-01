import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community new proposal page', () => {
  testPageCrash('http://localhost:8080/dydx/new/proposal/:type');

  testPageCrash('http://localhost:8080/dydx/new/proposal');
});
