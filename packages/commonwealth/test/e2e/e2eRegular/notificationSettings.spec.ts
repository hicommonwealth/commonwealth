import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test notification settings page', () => {
  testPageCrash('http://localhost:8080/notification-settings');
});
