import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test finish social login page', () => {
  testPageCrash('http://localhost:8080/finishsociallogin');
});
