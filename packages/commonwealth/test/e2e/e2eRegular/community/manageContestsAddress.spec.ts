import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community manage contests address page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/dydx/manage/contests/0x5809785C6c45553feFB8891A5AAAAAEe71e6cFED',
    ),
  );
});
