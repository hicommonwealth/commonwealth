import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community proposals page', () => {
  testPageCrash('http://localhost:8080/dydx/proposals');
});
