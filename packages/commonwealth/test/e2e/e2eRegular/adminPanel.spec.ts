import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test admin panel page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/admin-panel'));
});
