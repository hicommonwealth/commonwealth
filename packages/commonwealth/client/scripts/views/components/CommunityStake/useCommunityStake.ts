import { STAKE_ID } from '@hicommonwealth/chains';
import { calculateVoteWeight } from '@hicommonwealth/chains/build/commonProtocol/utils';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import app from 'state';
import {
  useFetchCommunityStakeQuery,
  useGetBuyPriceQuery,
  useGetUserStakeBalanceQuery,
} from 'state/api/communityStake';

interface UseCommunityStakeProps {
  communityId?: string;
  stakeId?: number;
}

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const { communityId, stakeId = STAKE_ID } = props;
  const { isLoggedIn } = useUserLoggedIn();

  const activeCommunityId = app?.chain?.id;
  const activeCommunityNamespace = app?.chain?.meta?.namespace;

  const { isInitialLoading: communityStakeLoading, data: stakeResponse } =
    useFetchCommunityStakeQuery({
      communityId: communityId || activeCommunityId,
      stakeId,
      apiEnabled: !!activeCommunityId,
    });

  const stakeData = stakeResponse?.data?.result;
  const stakeEnabled = stakeData?.stake_enabled;
  const apiEnabled = Boolean(
    stakeEnabled && !!activeCommunityNamespace && isLoggedIn,
  );

  const {
    isInitialLoading: userStakeBalanceLoading,
    data: userStakeBalanceData,
  } = useGetUserStakeBalanceQuery({
    namespace: activeCommunityNamespace,
    stakeId: STAKE_ID,
    apiEnabled,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useGetBuyPriceQuery({
      namespace: activeCommunityNamespace,
      stakeId: STAKE_ID,
      amount: Number(userStakeBalanceData),
      apiEnabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
    });

  const voteWeight = calculateVoteWeight(
    userStakeBalanceData,
    stakeData?.vote_weight,
  );
  const stakeBalance = Number(userStakeBalanceData);
  const stakeValue = stakeBalance * Number(buyPriceData?.price);
  const isLoading =
    communityStakeLoading || userStakeBalanceLoading || buyPriceDataLoading;

  return {
    stakeEnabled,
    stakeBalance,
    voteWeight,
    stakeValue,
    isLoading,
  };
};

export default useCommunityStake;
