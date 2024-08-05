import { test } from '@playwright/test';
import { testPageCrash } from '../common/testPageCrash';

test.describe('Test community new proposal page', () => {
  // shouldn't crash even when url params are invalid or data relevant to those params is non-existant
  testPageCrash('http://localhost:8080/cosmos/new/proposal/communitySpend');
  testPageCrash('http://localhost:8080/cosmos/new/proposal/textProposal');
  testPageCrash(
    'http://localhost:8080/cosmos/new/proposal/unsupportedWildCard',
  );
  testPageCrash('http://localhost:8080/cosmos/new/proposal');
});
