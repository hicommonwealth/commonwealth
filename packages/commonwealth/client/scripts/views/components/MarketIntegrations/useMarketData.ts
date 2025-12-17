import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { discoverKalshiMarkets } from '../../../services/kalshiApi'; // Corrected import path
import { trpc } from '../../../utils/trpcClient';
import { Market, MarketFilters } from './types';

export function useMarketData(communityId: string) {
  const [filters, setFilters] = useState<MarketFilters>({
    search: '',
    provider: 'all',
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
      enabled: filters.provider === 'all' || filters.provider === 'kalshi', // Only fetch if Kalshi is selected or all providers
    });

  const discoveredMarkets = useMemo(() => {
    // For now, only Kalshi markets are discovered.
    // If other providers were integrated, their discovered markets would be combined here.
    return discoveredKalshiMarkets || [];
  }, [discoveredKalshiMarkets]);

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

  const saveSelection = () => {
    const marketsToSave = (discoveredMarkets || []).filter((market) =>
      selectedMarkets.has(market.id),
    );

    marketsToSave.forEach((market) => {
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
    });
    setSelectedMarkets(new Set());
  };

  return {
    filters,
    setFilters,
    markets: filteredDiscoveredMarkets,
    isLoading: isLoadingKalshi || isLoadingSaved,
    selectedMarkets,
    handleSelectionChange,
    savedMarketIds,
    saveSelection,
    isSaving: isSubscribing,
  };
}
