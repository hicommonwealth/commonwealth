import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test profile edit page', () => {
  testPageCrash('http://localhost:8080/profile/edit');
});
