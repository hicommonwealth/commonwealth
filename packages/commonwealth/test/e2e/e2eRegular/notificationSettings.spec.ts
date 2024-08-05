import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test notification settings page', () => {
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/notification-settings',
    ),
  );
});
