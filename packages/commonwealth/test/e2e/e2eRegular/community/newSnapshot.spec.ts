import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community new snapshot page', () => {
  testPageCrash('http://localhost:8080/dydx/new/snapshot/:snapshotId');

  testPageCrash('http://localhost:8080/dydx/new/snapshot-proposal/:snapshotId');

  testPageCrash(
    'http://localhost:8080/dydx/new/snapshot-proposals/:snapshotId',
  );
});
