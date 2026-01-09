import { trpc } from 'utils/trpcClient';
import {
  Market,
  MarketFilters,
} from 'views/components/MarketIntegrations/types';

interface UseDiscoverPolymarketMarketsQueryProps {
  filters: MarketFilters;
  enabled?: boolean;
}

const useDiscoverPolymarketMarketsQuery = ({
  enabled = true,
}: UseDiscoverPolymarketMarketsQueryProps) => {
  const query = trpc.community.discoverExternalMarkets.useQuery(
    { provider: 'polymarket' },
    { enabled },
  );

  // Transform the backend response to match the frontend Market type
  const data: Market[] | undefined = query.data?.map((market) => ({
    id: market.id,
    provider: market.provider,
    slug: market.slug,
    question: market.question,
    category: market.category,
    status: market.status,
    startTime: market.startTime ? new Date(market.startTime) : null,
    endTime: market.endTime ? new Date(market.endTime) : null,
    imageUrl: market.imageUrl,
  }));

  return {
    ...query,
    data,
  };
};

export default useDiscoverPolymarketMarketsQuery;
