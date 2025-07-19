import { TokenView } from '@hicommonwealth/schemas';
import { calculateTokenPricing } from 'helpers/launchpad';
import NodeInfo from 'models/NodeInfo';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import {
  useEthPerTokenQuery,
  useGetTokenInfoAlchemy,
} from 'state/api/launchPad';
import { fetchCachedNodes } from 'state/api/nodes';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { z } from 'zod';
import useUserStore from '../state/ui/user';

export const useTokenPricing = ({ token }: { token: LaunchpadToken }) => {
  const { data: tokenCommunity } = useGetCommunityByIdQuery({
    id: token?.community_id || 'ethereum',
    enabled: !!token?.community_id,
    includeNodeInfo: true,
  });

  const user = useUserStore();
  const nodes = fetchCachedNodes();
  const communityNode = nodes?.find(
    (n) => n.id === tokenCommunity?.chain_node_id,
  ) as NodeInfo;

  const { data: ethPerToken = 0 } = useEthPerTokenQuery({
    ethChainId: communityNode?.ethChainId || 1,
    chainRpc: communityNode?.url,
    tokenAddress: (token as LaunchpadToken)?.token_address,
    enabled: !!tokenCommunity,
  });

  const uniswapPricingEnabled =
    token?.liquidity_transferred && !!communityNode?.ethChainId;

  const enabled =
    uniswapPricingEnabled &&
    !!communityNode?.ethChainId &&
    !!token?.token_address &&
    user?.isLoggedIn;

  // Get MCAP/pricing from uniswap only when token liquidity transferred to uniswap
  const { data: uniswapResponse } = useGetTokenInfoAlchemy({
    token_address: token?.token_address,
    eth_chain_id: communityNode?.ethChainId,
    enabled: !!enabled,
  });

  const uniswapData = uniswapResponse?.data;

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  let pricing = calculateTokenPricing(
    token as z.infer<typeof TokenView>,
    ethToUsdRate,
    ethPerToken,
  );

  // only replace pricing with uniswap pricing if exists
  if (uniswapData && uniswapData?.length > 0) {
    const todaysPricing = uniswapData.length - 1;
    const yesterdaysPricing = uniswapData.length - 1;

    const currentPrice = parseFloat(uniswapData[todaysPricing].value);
    const yesterdaysPrice =
      parseFloat(uniswapData[yesterdaysPricing].value) ||
      token?.old_price ||
      currentPrice;

    const priceChange = currentPrice - yesterdaysPrice / yesterdaysPrice;
    pricing = {
      currentPrice: parseFloat(
        parseFloat(uniswapData[todaysPricing].value).toFixed(2),
      ),
      pricePercentage24HourChange: parseFloat(priceChange.toFixed(2)),
      marketCapCurrent: parseFloat(
        parseFloat(uniswapData[todaysPricing].marketCap).toFixed(2),
      ),
      marketCapGoal: pricing.marketCapGoal,
      isMarketCapGoalReached: true,
    };
    pricing.currentPrice =
      parseFloat(uniswapData[todaysPricing].value) / ethToUsdRate;
    pricing.marketCapCurrent = parseFloat(uniswapData[todaysPricing].marketCap);
  }

  return { pricing, ethToUsdRate, isLoading: isLoadingETHToCurrencyRate };
};
