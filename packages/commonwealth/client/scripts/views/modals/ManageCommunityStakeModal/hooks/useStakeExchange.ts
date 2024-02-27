import { commonProtocol } from '@hicommonwealth/core';
import app from 'state';
import {
  useFetchEthUsdRateQuery,
  useGetBuyPriceQuery,
  useGetSellPriceQuery,
} from 'state/api/communityStake';
import useGetUserEthBalanceQuery from 'state/api/communityStake/getUserEthBalance';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';

interface UseStakeExchangeProps {
  mode: ManageCommunityStakeModalMode;
  address: string;
  numberOfStakeToExchange: number;
}

const useStakeExchange = ({
  mode,
  address,
  numberOfStakeToExchange,
}: UseStakeExchangeProps) => {
  const activeCommunityNamespace = app?.chain?.meta?.namespace;
  const chainRpc = app?.chain?.meta?.ChainNode?.url;
  const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;

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
