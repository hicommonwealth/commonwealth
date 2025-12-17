import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { discoverKalshiMarkets } from '../../../services/kalshiApi';
import { discoverPolymarketMarkets } from '../../../services/polymarketApi';
import { trpc } from '../../../utils/trpcClient';
import { Market, MarketFilters } from './types';

export function useMarketData(communityId: string) {
  const [filters, setFilters] = useState<MarketFilters>({
    search: '',
    provider: 'all',
    category: 'all',
  });
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(
    new Set(),
  );

  // Fetch markets already saved to the community
  const { data: savedMarkets, isLoading: isLoadingSaved } =
    trpc.community.getMarkets.useQuery({
      community_id: communityId,
    });

  // Fetch discovered markets from Kalshi API
  const { data: discoveredKalshiMarkets, isLoading: isLoadingKalshi } =
    useQuery<Market[], Error>({
      queryKey: ['kalshiMarkets', filters],
      queryFn: () => discoverKalshiMarkets(filters),
      enabled: filters.provider === 'all' || filters.provider === 'kalshi',
    });

  // Fetch discovered markets from Polymarket API
  const { data: discoveredPolymarketMarkets, isLoading: isLoadingPolymarket } =
    useQuery<Market[], Error>({
      queryKey: ['polymarketMarkets', filters],
      queryFn: () => discoverPolymarketMarkets(filters),
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
    return new Set(savedMarkets?.map((m) => m.id) ?? []);
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

  const handleSelectionChange = (marketId: string, isSelected: boolean) => {
    setSelectedMarkets((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(marketId);
      } else {
        newSelection.delete(marketId);
      }
      return newSelection;
    });
  };

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
      start_time: market.startTime,
      end_time: market.endTime,
      status: market.status as 'open',
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
    markets: filteredDiscoveredMarkets,
    categories,
    isLoading: isLoadingKalshi || isLoadingSaved || isLoadingPolymarket,
    savedMarketIds,
    onSubscribe,
    onUnsubscribe,
    isSaving: isSubscribing || isUnsubscribing,
  };
}
