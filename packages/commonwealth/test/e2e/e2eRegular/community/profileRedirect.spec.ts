import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community profile redirect page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  testPageCrash(
    'http://localhost:8080/dydx/account/0x5809785C6c45553feFB8891A5AAAAAEe71e6cFED',
  );
  testPageCrash('http://localhost:8080/dydx/account');
});
