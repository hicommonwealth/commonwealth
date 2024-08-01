import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test discord callback page', () => {
  testPageCrash('http://localhost:8080/discord-callback');
});
