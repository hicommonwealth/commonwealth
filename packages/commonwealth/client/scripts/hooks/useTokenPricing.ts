import { TokenView } from '@hicommonwealth/schemas';
import { calculateTokenPricing } from 'helpers/launchpad';
import NodeInfo from 'models/NodeInfo';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useEthPerTokenQuery } from 'state/api/launchPad';
import { fetchCachedNodes } from 'state/api/nodes';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { z } from 'zod';

export const useTokenPricing = ({ token }: { token: LaunchpadToken }) => {
  const { data: tokenCommunity } = useGetCommunityByIdQuery({
    id: token?.community_id || 'ethereum',
    enabled: !!token?.community_id,
    includeNodeInfo: true,
  });

  const nodes = fetchCachedNodes();
  const communityNode = nodes?.find(
    (n) => n.id === tokenCommunity?.chain_node_id,
  ) as NodeInfo;

  const { data: ethPerToken = 0 } = useEthPerTokenQuery({
    ethChainId: communityNode?.ethChainId || 1,
    chainRpc: communityNode?.url,
    tokenAddress: (token as LaunchpadToken)?.token_address,
    enabled: !!tokenCommunity && !!token?.token_address,
  });

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  const pricing = calculateTokenPricing(
    token as z.infer<typeof TokenView>,
    ethToUsdRate,
    ethPerToken,
  );

  return { pricing, isLoading: isLoadingETHToCurrencyRate };
};
