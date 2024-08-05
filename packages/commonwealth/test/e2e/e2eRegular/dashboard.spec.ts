import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test dashboard page', () => {
  test(...generatePageCrashTestConfig(`http://localhost:8080/dashboard`));

  test(
    ...generatePageCrashTestConfig(`http://localhost:8080/dashboard/for-you`),
  );

  test(
    ...generatePageCrashTestConfig(`http://localhost:8080/dashboard/global`),
  );
});
