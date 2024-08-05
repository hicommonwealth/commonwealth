import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community manage integrations page', () => {
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/manage/integrations',
    ),
  );
});
