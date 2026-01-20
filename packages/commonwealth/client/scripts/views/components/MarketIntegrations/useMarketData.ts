import { useMemo, useState } from 'react';
import { useDiscoverExternalMarketsQuery } from 'state/api/markets';
import { trpc } from '../../../utils/trpcClient';
import { Market, MarketFilters } from './types';

export function useMarketData(communityId: string) {
  const [filters, setFilters] = useState<MarketFilters>({
    search: '',
    provider: 'all',
    category: 'all',
  });

  const trpcUtils = trpc.useUtils();

  const { data: savedMarketsData, isLoading: isLoadingSaved } =
    trpc.community.getMarkets.useInfiniteQuery(
      {
        community_id: communityId,
        limit: 50, // Fetch more to check subscriptions
      },
      {
        enabled: !!communityId,
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

  const savedMarkets = savedMarketsData?.pages.flatMap((page) => page.results);

  const {
    data: discoveredMarkets,
    isLoading: isLoadingDiscovered,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDiscoverExternalMarketsQuery({
    filters,
    limit: 20, // Use consistent pagination
  });

  const categories = useMemo(() => {
    const allCategories = (discoveredMarkets || []).map(
      (market) => market.category,
    );
    return ['all', ...Array.from(new Set(allCategories))];
  }, [discoveredMarkets]);

  const savedMarketIds = useMemo(() => {
    return savedMarkets && savedMarkets.length > 0
      ? new Set<string>(savedMarkets.map((m) => m.slug))
      : new Set<string>();
  }, [savedMarkets]);

  const { mutate: subscribeMarket, isPending: isSubscribing } =
    trpc.community.subscribeMarket.useMutation();
  const { mutate: unsubscribeMarket, isPending: isUnsubscribing } =
    trpc.community.unsubscribeMarket.useMutation();

  const onSubscribe = (market: Market) => {
    subscribeMarket({
      community_id: communityId,
      provider: market.provider,
      slug: market.slug,
      question: market.question,
      category: market.category,
      start_time: market.startTime ?? new Date(), // TODO: make sure we have a start time
      end_time: market.endTime ?? new Date(), // TODO: make sure we have an end time
      status: market.status as 'open',
    });
    void trpcUtils.community.getMarkets.invalidate({
      community_id: communityId,
    });
  };

  const onUnsubscribe = (market: Market) => {
    unsubscribeMarket({
      community_id: communityId,
      slug: market.slug,
    });
    void trpcUtils.community.getMarkets.invalidate({
      community_id: communityId,
    });
  };

  return {
    filters,
    setFilters,
    markets: discoveredMarkets || [],
    categories,
    isLoading: isLoadingDiscovered || isLoadingSaved,
    savedMarketIds,
    onSubscribe,
    onUnsubscribe,
    isSaving: isSubscribing || isUnsubscribing,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  };
}
