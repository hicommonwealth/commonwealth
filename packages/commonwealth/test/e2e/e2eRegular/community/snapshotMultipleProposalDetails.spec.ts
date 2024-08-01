import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community snapshot multiple proposal details page', () => {
  testPageCrash('http://localhost:8080/dydx/multiple-snapshots');
});
