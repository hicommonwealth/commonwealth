import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test communities page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/communities'));
});
