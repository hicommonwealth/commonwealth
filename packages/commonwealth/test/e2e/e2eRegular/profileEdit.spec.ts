import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test profile edit page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/profile/edit'));
});
