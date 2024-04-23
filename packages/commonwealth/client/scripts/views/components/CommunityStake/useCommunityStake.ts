import { commonProtocol } from '@hicommonwealth/shared';
import ChainInfo from 'client/scripts/models/ChainInfo';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import app from 'state';
import {
  useFetchCommunityStakeQuery,
  useGetBuyPriceQuery,
  useGetUserStakeBalanceQuery,
} from 'state/api/communityStake';
import { useFlag } from '../../../hooks/useFlag';
import { CommunityData } from '../../pages/DirectoryPage/DirectoryPageContent';

interface UseCommunityStakeProps {
  community?: ChainInfo | CommunityData;
  stakeId?: number;
  walletAddress?: string;
}

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const communityStakeEnabled = useFlag('communityStake');
  const { community, stakeId = commonProtocol.STAKE_ID, walletAddress } = props;
  const { isLoggedIn } = useUserLoggedIn();

  const activeCommunityId = community?.id || app?.chain?.id;
  const activeCommunityNamespace =
    community?.namespace || app?.chain?.meta?.namespace;
  const chainRpc =
    community?.ChainNode?.url || app?.chain?.meta?.ChainNode?.url;
  const ethChainId =
    community?.ChainNode?.ethChainId || app?.chain?.meta?.ChainNode?.ethChainId;
  const activeAccountAddress = app?.user?.activeAccount?.address;

  const {
    isInitialLoading: communityStakeLoading,
    data: stakeResponse,
    refetch: refetchStakeQuery,
  } = useFetchCommunityStakeQuery({
    communityId: activeCommunityId,
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
    ethChainId,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useGetBuyPriceQuery({
      namespace: activeCommunityNamespace,
      stakeId: commonProtocol.STAKE_ID,
      amount: Number(userStakeBalanceData),
      apiEnabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
      chainRpc,
      ethChainId,
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
    refetchStakeQuery,
  };
};

export default useCommunityStake;
