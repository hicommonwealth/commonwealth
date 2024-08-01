import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community home page', () => {
  testPageCrash('http://localhost:8080/dydx');

  testPageCrash('http://localhost:8080/dydx/home');
});
