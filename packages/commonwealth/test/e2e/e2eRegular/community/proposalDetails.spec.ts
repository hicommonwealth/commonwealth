import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community proposal details page', () => {
  testPageCrash('http://localhost:8080/dydx/proposal/:type/:identifier');

  testPageCrash('http://localhost:8080/dydx/proposal/:identifier');
});
