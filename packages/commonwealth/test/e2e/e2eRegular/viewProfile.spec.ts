import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test view profile page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  testPageCrash('http://localhost:8080/profile/id/12345');
});
