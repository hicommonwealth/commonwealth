import { STAKE_ID } from '@hicommonwealth/chains';
import { useState } from 'react';
import app from 'state';
import {
  useFetchEthUsdRateQuery,
  useGetBuyPriceQuery,
} from 'state/api/communityStake';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
import useGetUserEthBalanceQuery from '../../../state/api/communityStake/getUserEthBalance';

interface UseStakeExchangeProps {
  mode: ManageCommunityStakeModalMode;
}

const useStakeExchange = ({ mode }: UseStakeExchangeProps) => {
  const [numberOfStakeToExchange, setNumberOfStakeToExchange] = useState(1);

  const activeCommunityNamespace = app?.chain?.meta?.namespace;

  const { data: userEthBalance } = useGetUserEthBalanceQuery();

  const { data: buyPriceData } = useGetBuyPriceQuery({
    namespace: activeCommunityNamespace,
    stakeId: STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'buy',
  });

  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  return {
    numberOfStakeToExchange,
    setNumberOfStakeToExchange,
    buyPriceData,
    ethUsdRate,
    userEthBalance,
  };
};

export default useStakeExchange;
