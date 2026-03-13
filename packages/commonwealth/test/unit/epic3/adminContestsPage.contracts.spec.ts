import { describe, expect, test } from 'vitest';
import {
  hasNoContests,
  shouldShowFeeManagerBanner,
} from '../../../client/scripts/views/pages/CommunityManagement/Contests/AdminContestsPage/adminContestsPage.contracts';

describe('AdminContestsPage contracts', () => {
  describe('hasNoContests', () => {
    test('returns true only when both contest lists are empty and loading is complete', () => {
      expect(
        hasNoContests({
          isContestDataLoading: false,
          activeContestsCount: 0,
          finishedContestsCount: 0,
        }),
      ).toBe(true);

      expect(
        hasNoContests({
          isContestDataLoading: true,
          activeContestsCount: 0,
          finishedContestsCount: 0,
        }),
      ).toBe(false);

      expect(
        hasNoContests({
          isContestDataLoading: false,
          activeContestsCount: 1,
          finishedContestsCount: 0,
        }),
      ).toBe(false);
    });
  });

  describe('shouldShowFeeManagerBanner', () => {
    test('requires weighted-voting topics, contest availability, chain support, and namespace', () => {
      expect(
        shouldShowFeeManagerBanner({
          hasAtLeastOneWeightedVotingTopic: true,
          isContestAvailable: true,
          ethChainId: 8453,
          namespace: 'common',
        }),
      ).toBe(true);

      expect(
        shouldShowFeeManagerBanner({
          hasAtLeastOneWeightedVotingTopic: false,
          isContestAvailable: true,
          ethChainId: 8453,
          namespace: 'common',
        }),
      ).toBe(false);

      expect(
        shouldShowFeeManagerBanner({
          hasAtLeastOneWeightedVotingTopic: true,
          isContestAvailable: true,
          ethChainId: 0,
          namespace: 'common',
        }),
      ).toBe(false);
    });
  });
});
