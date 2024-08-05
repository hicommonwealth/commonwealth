import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community create group page', () => {
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/members/groups/create',
    ),
  );
});
