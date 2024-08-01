import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community manage contests page', () => {
  testPageCrash('http://localhost:8080/dydx/manage/contests');
});
