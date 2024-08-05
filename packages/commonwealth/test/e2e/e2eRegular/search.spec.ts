import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test search page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/search'));
});
