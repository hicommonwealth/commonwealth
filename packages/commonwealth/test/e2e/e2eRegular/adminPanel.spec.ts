import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test admin panel page', () => {
  testPageCrash('http://localhost:8080/admin-panel');
});
