import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test notifications page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/notifications'));
});
