import { useMemo, useState } from 'react';
import { useDiscoverExternalMarketsQuery } from 'state/api/markets';
import { trpc } from '../../../utils/trpcClient';
import { Market, MarketFilters } from './types';

export function useMarketData(communityId: string) {
  const [filters, setFilters] = useState<MarketFilters>({
    search: '',
    provider: 'all',
    category: 'all',
    status: 'all',
    sortOrder: 'newest',
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

  // Fetch all categories from an unfiltered query (completely independent of current filters)
  // This ensures all categories remain visible in the dropdown even when filters are applied
  // We use a separate query key by always using 'all' for category and status, and empty search
  const { data: allMarketsForCategories } = useDiscoverExternalMarketsQuery({
    filters: {
      search: '',
      provider: filters.provider,
      category: 'all',
      status: 'all',
      sortOrder: 'newest',
    },
    limit: 50, // Maximum allowed by schema - should be enough to get most categories
    enabled: !!communityId, // Only enable if we have a communityId
  });

  const categories = useMemo(() => {
    // Always use the unfiltered categories query - never fall back to filtered discoveredMarkets
    // This ensures categories don't disappear when a category filter is applied
    // If allMarketsForCategories hasn't loaded yet, return empty array (will show 'all' only)
    if (!allMarketsForCategories || allMarketsForCategories.length === 0) {
      return ['all'];
    }

    const allCategories = allMarketsForCategories
      .map((market) => market.category)
      .filter((cat) => cat && cat.trim() !== ''); // Filter out empty/null categories

    const uniqueCategories = Array.from(new Set(allCategories)).sort();
    return ['all', ...uniqueCategories];
  }, [allMarketsForCategories]); // Only depend on allMarketsForCategories, not discoveredMarkets

  const savedMarketIds = useMemo(() => {
    return savedMarkets && savedMarkets.length > 0
      ? new Set<string>(savedMarkets.map((m) => m.slug))
      : new Set<string>();
  }, [savedMarkets]);

  const { mutate: subscribeMarket, isPending: isSubscribing } =
    trpc.community.subscribeMarket.useMutation({
      onSuccess: () => {
        void trpcUtils.community.getMarkets.invalidate({
          community_id: communityId,
        });
      },
    });
  const { mutate: unsubscribeMarket, isPending: isUnsubscribing } =
    trpc.community.unsubscribeMarket.useMutation({
      onSuccess: () => {
        void trpcUtils.community.getMarkets.invalidate({
          community_id: communityId,
        });
      },
    });

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
      image_url: market.imageUrl,
    });
  };

  const onUnsubscribe = (market: Market) => {
    unsubscribeMarket({
      community_id: communityId,
      slug: market.slug,
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
