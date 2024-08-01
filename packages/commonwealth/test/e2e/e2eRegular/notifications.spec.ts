import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test notifications page', () => {
  testPageCrash('http://localhost:8080/notifications');
});
