import { commonProtocol } from '@hicommonwealth/shared';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import ChainInfo from 'models/ChainInfo';
import app from 'state';
import {
  useFetchCommunityStakeQuery,
  useGetBuyPriceQuery,
  useGetUserStakeBalanceQuery,
} from 'state/api/communityStake';
import useUserStore from 'state/ui/user';
import { CommunityData } from '../../pages/DirectoryPage/DirectoryPageContent';

interface UseCommunityStakeProps {
  community?: ChainInfo | CommunityData;
  stakeId?: number;
  walletAddress?: string;
}

const chainIds = {
  1397: 'Blast',
  1322: 'Base',
  37: 'Ethereum',
};

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const { community, stakeId = commonProtocol.STAKE_ID, walletAddress } = props;
  const { isLoggedIn } = useUserLoggedIn();
  const user = useUserStore();

  const activeCommunityId = community?.id || app?.chain?.id;
  const activeCommunityNamespace =
    community?.namespace || app?.chain?.meta?.namespace;
  const chainRpc =
    community?.ChainNode?.url || app?.chain?.meta?.ChainNode?.url;
  const ethChainId =
    community?.ChainNode?.ethChainId || app?.chain?.meta?.ChainNode?.ethChainId;
  const activeAccountAddress = user.activeAccount?.address || '';
  const activeChainId = chainIds[app?.chain?.meta?.ChainNode?.id];

  const {
    isInitialLoading: communityStakeLoading,
    data: stakeResponse,
    refetch: refetchStakeQuery,
  } = useFetchCommunityStakeQuery({
    communityId: activeCommunityId,
    stakeId,
    apiEnabled: !!activeCommunityId,
  });

  const stakeData = stakeResponse?.data?.result;
  const stakeEnabled = stakeData?.stake_enabled;
  const apiEnabled = Boolean(
    stakeEnabled &&
      (walletAddress || activeAccountAddress) &&
      !!activeCommunityNamespace &&
      isLoggedIn,
  );

  const {
    isInitialLoading: userStakeBalanceLoading,
    data: userStakeBalanceData,
  } = useGetUserStakeBalanceQuery({
    // @ts-expect-error StrictNullChecks
    namespace: activeCommunityNamespace,
    stakeId: commonProtocol.STAKE_ID,
    apiEnabled,
    chainRpc,
    walletAddress: walletAddress || activeAccountAddress,
    keepPreviousData: true,
    // @ts-expect-error StrictNullChecks
    ethChainId,
  });

  const { isInitialLoading: buyPriceDataLoading, data: buyPriceData } =
    useGetBuyPriceQuery({
      // @ts-expect-error StrictNullChecks
      namespace: activeCommunityNamespace,
      stakeId: commonProtocol.STAKE_ID,
      amount: Number(userStakeBalanceData),
      apiEnabled: apiEnabled && !isNaN(Number(userStakeBalanceData)),
      chainRpc,
      // @ts-expect-error StrictNullChecks
      ethChainId,
      keepPreviousData: true,
    });

  const currentVoteWeight = commonProtocol.calculateVoteWeight(
    // @ts-expect-error StrictNullChecks
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
    activeChainId,
    refetchStakeQuery,
  };
};

export default useCommunityStake;
