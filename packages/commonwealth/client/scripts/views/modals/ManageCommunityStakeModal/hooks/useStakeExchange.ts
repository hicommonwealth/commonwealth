import { commonProtocol } from '@hicommonwealth/evm-protocols';
import app from 'state';
import {
  useFetchTokenUsdRateQuery,
  useGetBuyPriceQuery,
  useGetSellPriceQuery,
} from 'state/api/communityStake';
import useGetUserEthBalanceQuery from 'state/api/communityStake/getUserEthBalance';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';

interface UseStakeExchangeProps {
  mode: ManageCommunityStakeModalMode;
  address: string;
  numberOfStakeToExchange: number;
  community?: {
    namespace?: string;
    ChainNode?: {
      url: string;
      ethChainId: number;
    };
  };
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
    community?.ChainNode?.url || app?.chain?.meta?.ChainNode?.url || '';
  const ethChainId =
    community?.ChainNode?.ethChainId ||
    app?.chain?.meta?.ChainNode?.eth_chain_id ||
    0;

  const { data: userEthBalance, isLoading: userEthBalanceLoading } =
    useGetUserEthBalanceQuery({
      chainRpc,
      walletAddress: address,
      apiEnabled: !!address,
      ethChainId,
    });

  const { data: buyPriceData } = useGetBuyPriceQuery({
    // @ts-expect-error StrictNullChecks
    namespace: activeCommunityNamespace,
    stakeId: commonProtocol.STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'buy' && !!address,
    chainRpc,
    ethChainId,
  });

  const { data: sellPriceData } = useGetSellPriceQuery({
    // @ts-expect-error StrictNullChecks
    namespace: activeCommunityNamespace,
    stakeId: commonProtocol.STAKE_ID,
    amount: numberOfStakeToExchange,
    apiEnabled: mode === 'sell',
    chainRpc,
    ethChainId,
  });

  const { data: ethUsdRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: 'ETH',
  });
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
