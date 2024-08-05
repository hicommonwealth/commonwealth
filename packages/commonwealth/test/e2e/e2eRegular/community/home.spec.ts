import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community home page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/dydx'));

  test(...generatePageCrashTestConfig('http://localhost:8080/dydx/home'));
});
