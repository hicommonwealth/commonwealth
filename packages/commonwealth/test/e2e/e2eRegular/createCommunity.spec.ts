import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from './common/testConfigs';

test.describe('Test create community page', () => {
  test(...generatePageCrashTestConfig('http://localhost:8080/createCommunity'));
});
