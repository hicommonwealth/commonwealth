import { trpc } from 'client/scripts/utils/trpcClient';

export type PredictionMarketStatusFilter =
  | 'draft'
  | 'active'
  | 'resolved'
  | 'cancelled';

export type DiscoverPredictionMarketsFilters = {
  community_id?: string;
  statuses: PredictionMarketStatusFilter[];
  sort: 'volume' | 'recency';
  search?: string;
};

type UseDiscoverPredictionMarketsQueryParams = {
  filters: DiscoverPredictionMarketsFilters;
  limit?: number;
  enabled?: boolean;
};

const useDiscoverPredictionMarketsQuery = ({
  filters,
  limit = 20,
  enabled = true,
}: UseDiscoverPredictionMarketsQueryParams) => {
  return trpc.predictionMarket.discoverPredictionMarkets.useInfiniteQuery(
    {
      community_id: filters.community_id,
      statuses: filters.statuses,
      sort: filters.sort,
      search: filters.search?.trim() || undefined,
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
};

export default useDiscoverPredictionMarketsQuery;
