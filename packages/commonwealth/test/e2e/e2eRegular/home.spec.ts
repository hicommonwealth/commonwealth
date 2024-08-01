import { test } from '@playwright/test';
import { testPageCrash } from './common/testPageCrash';

test.describe('Test home page', () => {
  testPageCrash(`http://localhost:8080/`);

  testPageCrash(`http://localhost:8080/home`);
});
