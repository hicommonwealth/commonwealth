import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test search page', () => {
  testPageCrash('http://localhost:8080/search');
});
