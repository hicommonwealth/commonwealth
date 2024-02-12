import { commonProtocol } from '@hicommonwealth/core';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import app from 'state';
import {
  useFetchCommunityStakeQuery,
  useGetBuyPriceQuery,
  useGetUserStakeBalanceQuery,
} from 'state/api/communityStake';
import { useFlag } from '../../../hooks/useFlag';

interface UseCommunityStakeProps {
  communityId?: string;
  stakeId?: number;
  walletAddress?: string;
}

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const communityStakeEnabled = useFlag('communityStake');
  const {
    communityId,
    stakeId = commonProtocol.STAKE_ID,
    walletAddress,
  } = props;
  const { isLoggedIn } = useUserLoggedIn();

  const activeCommunityId = app?.chain?.id;
  const activeCommunityNamespace = app?.chain?.meta?.namespace;
  const chainRpc = app?.chain?.meta?.ChainNode?.url;
  const activeAccountAddress = app?.user?.activeAccount?.address;

  const { isInitialLoading: communityStakeLoading, data: stakeResponse } =
    useFetchCommunityStakeQuery({
      communityId: communityId || activeCommunityId,
      stakeId,
      apiEnabled: communityStakeEnabled && !!activeCommunityId,
    });

  const stakeData = stakeResponse?.data?.result;
  const stakeEnabled = stakeData?.stake_enabled;
  const apiEnabled = Boolean(
    communityStakeEnabled &&
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
    stakeId: commonProtocol.STAKE_ID,
    apiEnabled,
    chainRpc,
    walletAddress: walletAddress || activeAccountAddress,
    keepPreviousData: true,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useGetBuyPriceQuery({
      namespace: activeCommunityNamespace,
      stakeId: commonProtocol.STAKE_ID,
      amount: Number(userStakeBalanceData),
      apiEnabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
      chainRpc,
      keepPreviousData: true,
    });

  const currentVoteWeight = commonProtocol.calculateVoteWeight(
    userStakeBalanceData,
    stakeData?.vote_weight,
  );
  const stakeBalance = Number(userStakeBalanceData);
  const stakeValue = Number(buyPriceData?.price);
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
