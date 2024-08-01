import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community snapshot details page', () => {
  testPageCrash('http://localhost:8080/dydx/snapshot/:snapshotId');

  testPageCrash('http://localhost:8080/dydx/snapshot/:snapshotId/:identifier');

  testPageCrash('http://localhost:8080/dydx/snapshot-proposals/:snapshotId');

  testPageCrash(
    'http://localhost:8080/dydx/snapshot-proposal/:snapshotId/:identifier',
  );

  testPageCrash(
    'http://localhost:8080/dydx/snapshot-proposals/:snapshotId/:identifier',
  );
});
