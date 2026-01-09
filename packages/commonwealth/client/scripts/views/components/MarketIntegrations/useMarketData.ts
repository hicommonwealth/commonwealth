import { useMemo, useState } from 'react';
import {
  useDiscoverKalshiMarketsQuery,
  useDiscoverPolymarketMarketsQuery,
} from 'state/api/markets';
import { trpc } from '../../../utils/trpcClient';
import { Market, MarketFilters } from './types';

export function useMarketData(communityId: string) {
  const [filters, setFilters] = useState<MarketFilters>({
    search: '',
    provider: 'all',
    category: 'all',
  });

  const trpcUtils = trpc.useUtils();

  // Fetch markets already saved to the community
  const { data: savedMarkets, isLoading: isLoadingSaved } =
    trpc.community.getMarkets.useQuery({
      community_id: communityId,
    });

  // Fetch discovered markets from Kalshi API
  const { data: discoveredKalshiMarkets, isLoading: isLoadingKalshi } =
    useDiscoverKalshiMarketsQuery({
      filters,
      enabled: filters.provider === 'all' || filters.provider === 'kalshi',
    });

  // Fetch discovered markets from Polymarket API
  const { data: discoveredPolymarketMarkets, isLoading: isLoadingPolymarket } =
    useDiscoverPolymarketMarketsQuery({
      filters,
      enabled: filters.provider === 'all' || filters.provider === 'polymarket',
    });

  const discoveredMarkets = useMemo(() => {
    const kalshiMarkets = discoveredKalshiMarkets || [];
    const polymarketMarkets = discoveredPolymarketMarkets || [];
    return [...kalshiMarkets, ...polymarketMarkets];
  }, [discoveredKalshiMarkets, discoveredPolymarketMarkets]);

  const categories = useMemo(() => {
    const allCategories = discoveredMarkets.map((market) => market.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [discoveredMarkets]);

  const savedMarketIds = useMemo(() => {
    return savedMarkets
      ? new Set<string>(savedMarkets.map((m) => m.slug))
      : new Set<string>();
  }, [savedMarkets]);

  const filteredDiscoveredMarkets = useMemo(() => {
    // Client-side filtering if 'tickers' parameter is not sufficient or if 'title' needs to be searched
    let filtered = discoveredMarkets;

    if (filters.search) {
      filtered = filtered.filter((market) =>
        market.question.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }
    if (filters.provider !== 'all') {
      filtered = filtered.filter(
        (market) => market.provider === filters.provider,
      );
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(
        (market) => market.category === filters.category,
      );
    }

    return filtered;
  }, [discoveredMarkets, filters]);

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
    markets: filteredDiscoveredMarkets,
    categories,
    isLoading: isLoadingKalshi || isLoadingSaved || isLoadingPolymarket,
    savedMarketIds,
    onSubscribe,
    onUnsubscribe,
    isSaving: isSubscribing || isUnsubscribing,
  };
}
