import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community update group page', () => {
  testPageCrash('http://localhost:8080/dydx/members/groups/:groupId/update');
});
