export const hasNoContests = ({
  isContestDataLoading,
  activeContestsCount,
  finishedContestsCount,
}: {
  isContestDataLoading: boolean;
  activeContestsCount: number;
  finishedContestsCount: number;
}) =>
  !isContestDataLoading &&
  activeContestsCount === 0 &&
  finishedContestsCount === 0;

export const shouldShowFeeManagerBanner = ({
  hasAtLeastOneWeightedVotingTopic,
  isContestAvailable,
  ethChainId,
  namespace,
}: {
  hasAtLeastOneWeightedVotingTopic: boolean;
  isContestAvailable: boolean;
  ethChainId: number;
  namespace?: string | null;
}) =>
  Boolean(
    hasAtLeastOneWeightedVotingTopic &&
      isContestAvailable &&
      ethChainId &&
      namespace,
  );
