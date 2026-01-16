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

  // Fetch markets already saved to the community
  const { data: savedMarkets, isLoading: isLoadingSaved } =
    trpc.community.getMarkets.useQuery({
      community_id: communityId,
    });

  // Fetch discovered markets from external APIs via backend proxy
  const { data: discoveredMarkets, isLoading: isLoadingDiscovered } =
    useDiscoverExternalMarketsQuery({
      filters,
    });

  const categories = useMemo(() => {
    const allCategories = (discoveredMarkets || []).map(
      (market) => market.category,
    );
    return ['all', ...Array.from(new Set(allCategories))];
  }, [discoveredMarkets]);

  const savedMarketIds = useMemo(() => {
    return savedMarkets
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
  };
}
