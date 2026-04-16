import { STAKE_ID } from '@hicommonwealth/evm-protocols';
import {
  getActiveContests,
  partitionContestsByStatus,
} from 'features/contests/utils/contestUtils';
import { useMemo } from 'react';
import app from 'state';
import { useFetchCommunityStakeQuery } from 'state/api/communityStake';
import { useGetContestsQuery } from 'state/api/contests';
import type { Contest } from '../types/contest';

export type UseCommunityContestsProps =
  | {
      shouldPolling?: boolean;
      fetchAll?: boolean;
      isCommunityHomePage?: boolean;
      search?: string;
    }
  | undefined;

const useCommunityContests = (props?: UseCommunityContestsProps) => {
  const {
    shouldPolling = false,
    fetchAll = false,
    isCommunityHomePage = false,
    search,
  } = props || {};
  const activeCommunityId = app.activeChainId() || '';

  const { data: communityStakeData } = useFetchCommunityStakeQuery({
    communityId: activeCommunityId,
    stakeId: STAKE_ID,
    apiEnabled: !!activeCommunityId,
  });
  const stakeEnabled = communityStakeData?.stake?.stake_enabled;

  const { data: contestsData, isLoading: isContestDataLoading } =
    useGetContestsQuery({
      community_id: activeCommunityId,
      shouldPolling,
      fetchAll,
      search,
    });

  // If we're on the community homepage, also fetch global contests (i.e. without filtering by community_id)
  // NOTE: This query will always run when isCommunityHomepage is true.
  const { data: globalContestsData, isLoading: isGlobalContestsLoading } =
    useGetContestsQuery({
      community_id: '',
      shouldPolling,
      fetchAll: true,
      search,
    });

  const { finishedContests, activeContests } = useMemo(
    () => partitionContestsByStatus(contestsData as Contest[] | undefined),
    [contestsData],
  );

  const globalActiveContests = useMemo(
    () => getActiveContests(globalContestsData as Contest[] | undefined),
    [globalContestsData],
  );

  const isSuggestedMode =
    isCommunityHomePage &&
    activeContests.length === 0 &&
    !!globalContestsData &&
    !isGlobalContestsLoading;

  const isContestAvailable =
    !isContestDataLoading && (contestsData?.length ?? 0) > 0;

  const getContestByAddress = (contestAddress: string) => {
    return (contestsData as Contest[] | undefined)?.find(
      (contest) => contest.contest_address === contestAddress,
    );
  };

  return {
    stakeEnabled,
    isContestAvailable,
    contestsData: {
      all: (contestsData as Contest[] | undefined) || [],
      finished: finishedContests,
      active: activeContests,
      suggested: globalActiveContests,
    },
    isContestDataLoading,
    getContestByAddress,
    isSuggestedMode,
  };
};

export default useCommunityContests;
