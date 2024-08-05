import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community new snapshot page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  testPageCrash('http://localhost:8080/dydx/new/snapshot/unsupportedWildCard');
  testPageCrash(
    'http://localhost:8080/dydx/new/snapshot-proposal/unsupportedWildCard',
  );
  testPageCrash(
    'http://localhost:8080/dydx/new/snapshot-proposals/unsupportedWildCard',
  );
});
