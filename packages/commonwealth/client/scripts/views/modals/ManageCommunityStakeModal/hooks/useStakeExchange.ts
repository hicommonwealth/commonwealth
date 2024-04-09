import { commonProtocol } from '@hicommonwealth/shared';
import ChainInfo from 'models/ChainInfo';
import app from 'state';
import {
  useFetchEthUsdRateQuery,
  useGetBuyPriceQuery,
  useGetSellPriceQuery,
} from 'state/api/communityStake';
import useGetUserEthBalanceQuery from 'state/api/communityStake/getUserEthBalance';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
import { CommunityData } from 'views/pages/DirectoryPage/DirectoryPageContent';

interface UseStakeExchangeProps {
  mode: ManageCommunityStakeModalMode;
  address: string;
  numberOfStakeToExchange: number;
  community?: ChainInfo | CommunityData;
}

const useStakeExchange = ({
  mode,
  address,
  numberOfStakeToExchange,
  community,
}: UseStakeExchangeProps) => {
  const activeCommunityNamespace =
    community?.namespace || app?.chain?.meta?.namespace;
  const chainRpc =
    community?.ChainNode?.url || app?.chain?.meta?.ChainNode?.url;
  const ethChainId =
    community?.ChainNode?.ethChainId || app?.chain?.meta?.ChainNode?.ethChainId;

  const { data: userEthBalance, isLoading: userEthBalanceLoading } =
    useGetUserEthBalanceQuery({
      chainRpc,
      walletAddress: address,
      apiEnabled: !!address,
      ethChainId,
    });

  const { data: buyPriceData } = useGetBuyPriceQuery({
    namespace: activeCommunityNamespace,
    stakeId: commonProtocol.STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'buy' && !!address,
    chainRpc,
    ethChainId,
  });

  const { data: sellPriceData } = useGetSellPriceQuery({
    namespace: activeCommunityNamespace,
    stakeId: commonProtocol.STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'sell',
    chainRpc,
    ethChainId,
  });

  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  return {
    buyPriceData,
    ethUsdRate,
    userEthBalance,
    userEthBalanceLoading,
    sellPriceData,
  };
};

export default useStakeExchange;
