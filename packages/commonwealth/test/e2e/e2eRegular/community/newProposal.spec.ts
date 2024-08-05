import { test } from '@playwright/test';
import { generatePageCrashTestConfig } from '../common/testConfigs';

test.describe('Test community new proposal page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/cosmos/new/proposal/communitySpend',
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/cosmos/new/proposal/textProposal',
    ),
  );
  test(
    ...generatePageCrashTestConfig(
      'http://localhost:8080/cosmos/new/proposal/unsupportedWildCard',
    ),
  );
  test(
    ...generatePageCrashTestConfig('http://localhost:8080/cosmos/new/proposal'),
  );
});
