import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community create group page', () => {
  testPageCrash('http://localhost:8080/dydx/members/groups/create');
});
