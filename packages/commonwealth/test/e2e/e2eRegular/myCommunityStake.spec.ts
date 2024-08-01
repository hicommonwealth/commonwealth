import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test my community stake page', () => {
  testPageCrash('http://localhost:8080/myCommunityStake');
});
