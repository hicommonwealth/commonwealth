import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community proposal details page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  testPageCrash(
    'http://localhost:8080/dydx/proposal/communitySpend/123456-some-random-text',
  );
  testPageCrash('http://localhost:8080/dydx/proposal/123456-some-random-text');
});
