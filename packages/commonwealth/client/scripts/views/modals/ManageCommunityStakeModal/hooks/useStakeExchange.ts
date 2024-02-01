import { STAKE_ID } from '@hicommonwealth/chains';
import { useState } from 'react';
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
}

const useStakeExchange = ({ mode, address }: UseStakeExchangeProps) => {
  const [numberOfStakeToExchange, setNumberOfStakeToExchange] = useState(1);

  const activeCommunityNamespace = app?.chain?.meta?.namespace;
  const chainRpc = app?.chain?.meta?.ChainNode?.url;

  const { data: userEthBalance, isLoading: userEthBalanceLoading } =
    useGetUserEthBalanceQuery({
      chainRpc,
      walletAddress: address,
    });

  const { data: buyPriceData } = useGetBuyPriceQuery({
    namespace: activeCommunityNamespace,
    stakeId: STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'buy',
    chainRpc,
  });

  const { data: sellPriceData } = useGetSellPriceQuery({
    namespace: activeCommunityNamespace,
    stakeId: STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'sell',
    chainRpc,
  });

  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  return {
    numberOfStakeToExchange,
    setNumberOfStakeToExchange,
    buyPriceData,
    ethUsdRate,
    userEthBalance,
    userEthBalanceLoading,
    sellPriceData,
  };
};

export default useStakeExchange;
