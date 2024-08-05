import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test home page', () => {
  test(...generatePageCrashTestConfig(`http://localhost:8080/`));

  test(...generatePageCrashTestConfig(`http://localhost:8080/home`));
});
