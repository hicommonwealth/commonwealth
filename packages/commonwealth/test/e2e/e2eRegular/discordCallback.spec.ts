import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test discord callback page', () => {
  test(
    ...generatePageCrashTestConfig('http://localhost:8080/discord-callback'),
  );
});
