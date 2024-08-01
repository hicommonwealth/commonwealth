import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test create community page', () => {
  testPageCrash('http://localhost:8080/createCommunity');
});
