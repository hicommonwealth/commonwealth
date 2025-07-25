import { calculateVoteWeight, STAKE_ID } from '@hicommonwealth/evm-protocols';
import app from 'state';
import {
  useFetchCommunityStakeQuery,
  useGetBuyPriceQuery,
  useGetUserStakeBalanceQuery,
} from 'state/api/communityStake';
import useUserStore from 'state/ui/user';

interface UseCommunityStakeProps {
  community?: {
    id?: string;
    namespace?: string;
    ChainNode?: {
      url: string;
      ethChainId: number;
    };
  };
  stakeId?: number;
  walletAddress?: string;
}

const chainIds = {
  1397: 'Blast',
  1322: 'Base',
  37: 'Ethereum',
};

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const { community, stakeId = STAKE_ID, walletAddress } = props;
  const user = useUserStore();

  const activeCommunityId = community?.id || app?.chain?.id || '';
  const activeCommunityNamespace =
    community?.namespace || app?.chain?.meta?.namespace;
  const chainRpc =
    community?.ChainNode?.url || app?.chain?.meta?.ChainNode?.url || '';
  const ethChainId =
    community?.ChainNode?.ethChainId ||
    app?.chain?.meta?.ChainNode?.eth_chain_id ||
    0;
  const activeAccountAddress = user.activeAccount?.address || '';
  const activeChainId = chainIds[app?.chain?.meta?.ChainNode?.id || 0];

  const {
    isInitialLoading: communityStakeLoading,
    data: stakeData,
    refetch: refetchStakeQuery,
  } = useFetchCommunityStakeQuery({
    communityId: activeCommunityId,
    stakeId,
    apiEnabled: !!activeCommunityId,
  });

  const stakeEnabled = stakeData?.stake?.stake_enabled;
  const apiEnabled = Boolean(
    stakeEnabled &&
      (walletAddress || activeAccountAddress) &&
      !!activeCommunityNamespace &&
      user.isLoggedIn,
  );

  const {
    isInitialLoading: userStakeBalanceLoading,
    data: userStakeBalanceData,
  } = useGetUserStakeBalanceQuery({
    // @ts-expect-error StrictNullChecks
    namespace: activeCommunityNamespace,
    stakeId: STAKE_ID,
    apiEnabled,
    chainRpc,
    walletAddress: walletAddress || activeAccountAddress,
    keepPreviousData: true,
    ethChainId,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useGetBuyPriceQuery({
      namespace: activeCommunityNamespace!,
      stakeId: STAKE_ID,
      amount: Number(userStakeBalanceData),
      apiEnabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
      chainRpc,
      ethChainId,
      keepPreviousData: true,
    });

  const currentVoteWeight = calculateVoteWeight(
    // @ts-expect-error StrictNullChecks
    userStakeBalanceData,
    stakeData?.stake?.vote_weight,
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
    activeChainId,
    refetchStakeQuery,
  };
};

export default useCommunityStake;
