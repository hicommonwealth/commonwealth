import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community overview page', () => {
  testPageCrash('http://localhost:8080/dydx/overview');
});
