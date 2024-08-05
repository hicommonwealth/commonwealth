import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community snapshot details page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  testPageCrash(
    'http://localhost:8080/dydx/snapshot/someNonExistantSnapshotSpace',
  );
  testPageCrash(
    'http://localhost:8080/dydx/snapshot/someNonExistantSnapshotSpace/some-random-non-existant-address',
  );
  testPageCrash(
    'http://localhost:8080/dydx/snapshot-proposals/someNonExistantSnapshotSpace',
  );
  testPageCrash(
    'http://localhost:8080/dydx/snapshot-proposal/someNonExistantSnapshotSpace/some-random-non-existant-address',
  );
  testPageCrash(
    'http://localhost:8080/dydx/snapshot-proposals/someNonExistantSnapshotSpace/some-random-non-existant-address',
  );
});
