import { LaunchpadTokenView, ThreadTokenView } from '@hicommonwealth/schemas';
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

interface PostcoinTokenPricing {
  currentPrice: number;
  pricePercentage24HourChange: number;
  marketCapCurrent: number;
  marketCapGoal: number;
  isMarketCapGoalReached: boolean;
}

export const usePostcoinTokenPricing = ({
  token,
}: {
  token: z.infer<typeof ThreadTokenView>;
}) => {
  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });

  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  // Calculate pricing from token data
  const currentPrice = token?.latest_price || 0;
  const oldPrice = token?.old_price || 0;

  // Calculate 24h price change percentage
  const pricePercentage24HourChange =
    oldPrice > 0 ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0;

  // Calculate market cap (current price * initial supply)
  const marketCapCurrent = currentPrice * (token?.initial_supply || 0);
  const marketCapGoal = token?.eth_market_cap_target || 0;
  const isMarketCapGoalReached = marketCapCurrent >= marketCapGoal;

  const pricing: PostcoinTokenPricing = {
    currentPrice,
    pricePercentage24HourChange,
    marketCapCurrent,
    marketCapGoal,
    isMarketCapGoalReached,
  };

  return {
    pricing,
    ethToUsdRate,
    isLoading: isLoadingETHToCurrencyRate,
  };
};

export type Token =
  | z.infer<typeof LaunchpadTokenView>
  | z.infer<typeof ThreadTokenView>;

const useLaunchpadTokenPricing = ({
  token,
}: {
  token: z.infer<typeof LaunchpadTokenView>;
}) => {
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
    token as z.infer<typeof LaunchpadTokenView>,
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

export const useTokenPricing = ({ token }: { token: Token }) => {
  // Always call both hooks, but only use the result from the appropriate one
  const postcoinPricing = usePostcoinTokenPricing({
    token: token as z.infer<typeof ThreadTokenView>,
  });

  const launchpadPricing = useLaunchpadTokenPricing({
    token: token as z.infer<typeof LaunchpadTokenView>,
  });

  // Return the appropriate pricing based on token type
  return token?.token_type === 'postcoin' ? postcoinPricing : launchpadPricing;
};
