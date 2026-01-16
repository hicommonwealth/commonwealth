import { trpc } from 'utils/trpcClient';
import {
  Market,
  MarketFilters,
  MarketProvider,
} from 'views/components/MarketIntegrations/types';

interface UseDiscoverExternalMarketsQueryProps {
  filters: MarketFilters;
  enabled?: boolean;
}

const useDiscoverExternalMarketsQuery = ({
  filters,
  enabled = true,
}: UseDiscoverExternalMarketsQueryProps) => {
  const query = trpc.community.discoverExternalMarkets.useQuery(
    {
      provider: filters.provider,
      search: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
    },
    { enabled },
  );

  // Transform the backend response to match the frontend Market type
  const data: Market[] | undefined = query.data?.map((market) => ({
    id: market.id,
    provider: market.provider as MarketProvider,
    slug: market.slug,
    question: market.question,
    category: market.category,
    status: market.status,
    startTime: market.startTime ? new Date(market.startTime) : null,
    endTime: market.endTime ? new Date(market.endTime) : null,
    imageUrl: market.imageUrl,
    subTitle: market.subTitle,
  }));

  return {
    ...query,
    data,
  };
};

export default useDiscoverExternalMarketsQuery;
