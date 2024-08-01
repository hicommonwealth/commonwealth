import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test view profile page', () => {
  testPageCrash('http://localhost:8080/profile/id/:userId');
});
