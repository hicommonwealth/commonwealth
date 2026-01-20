import { trpc } from 'utils/trpcClient';
import {
  Market,
  MarketFilters,
  MarketProvider,
} from 'views/components/MarketIntegrations/types';

interface UseDiscoverExternalMarketsQueryProps {
  filters: MarketFilters;
  limit?: number;
  enabled?: boolean;
}

const useDiscoverExternalMarketsQuery = ({
  filters,
  limit = 20,
  enabled = true,
}: UseDiscoverExternalMarketsQueryProps) => {
  const query = trpc.community.discoverExternalMarkets.useInfiniteQuery(
    {
      provider: filters.provider,
      search: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      limit,
    },
    {
      enabled,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
    },
  );

  const markets: Market[] | undefined = query.data?.pages
    .flatMap((page) => page.results)
    .map((market) => ({
      id: market.id,
      provider: market.provider as MarketProvider,
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
    data: markets,
    markets,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isInitialLoading: query.isLoading && !query.data,
  };
};

export default useDiscoverExternalMarketsQuery;
