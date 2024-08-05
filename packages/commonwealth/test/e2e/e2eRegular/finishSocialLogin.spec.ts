import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test finish social login page', () => {
  test(
    ...generatePageCrashTestConfig('http://localhost:8080/finishsociallogin'),
  );
});
