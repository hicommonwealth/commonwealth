import { STAKE_ID } from '@hicommonwealth/chains';
import { calculateVoteWeight } from '@hicommonwealth/chains/build/commonProtocol/utils';
import { featureFlags } from 'helpers/feature-flags';
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
  walletAddress?: string;
}

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const { communityId, stakeId = STAKE_ID, walletAddress } = props;
  const { isLoggedIn } = useUserLoggedIn();

  const activeCommunityId = app?.chain?.id;
  const activeCommunityNamespace = app?.chain?.meta?.namespace;
  const chainRpc = app?.chain?.meta?.ChainNode?.url;
  const activeAccountAddress = app?.user?.activeAccount?.address;

  const { isInitialLoading: communityStakeLoading, data: stakeResponse } =
    useFetchCommunityStakeQuery({
      communityId: communityId || activeCommunityId,
      stakeId,
      apiEnabled: featureFlags.communityStake && !!activeCommunityId,
    });

  const stakeData = stakeResponse?.data?.result;
  const stakeEnabled = stakeData?.stake_enabled;
  const apiEnabled = Boolean(
    featureFlags.communityStake &&
      stakeEnabled &&
      (walletAddress || activeAccountAddress) &&
      !!activeCommunityNamespace &&
      isLoggedIn,
  );

  const {
    isInitialLoading: userStakeBalanceLoading,
    data: userStakeBalanceData,
  } = useGetUserStakeBalanceQuery({
    namespace: activeCommunityNamespace,
    stakeId: STAKE_ID,
    apiEnabled,
    chainRpc,
    walletAddress: walletAddress || activeAccountAddress,
    keepPreviousData: true,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useGetBuyPriceQuery({
      namespace: activeCommunityNamespace,
      stakeId: STAKE_ID,
      amount: Number(userStakeBalanceData),
      apiEnabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
      chainRpc,
      keepPreviousData: true,
    });

  const currentVoteWeight = calculateVoteWeight(
    userStakeBalanceData,
    stakeData?.vote_weight,
  );
  const stakeBalance = Number(userStakeBalanceData);
  const stakeValue = stakeBalance * Number(buyPriceData?.price);
  const isLoading =
    communityStakeLoading || userStakeBalanceLoading || buyPriceDataLoading;

  return {
    stakeData,
    stakeEnabled,
    stakeBalance,
    currentVoteWeight,
    stakeValue,
    isLoading,
  };
};

export default useCommunityStake;
