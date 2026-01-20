import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import app from 'client/scripts/state';
import React, { useEffect, useMemo, useState } from 'react';
import { useDiscoverExternalMarketsQuery } from 'state/api/markets';
import { trpc } from 'utils/trpcClient';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { MarketCard } from 'views/components/MarketIntegrations/MarketCard';
import {
  Market,
  MarketFilters,
} from 'views/components/MarketIntegrations/types';
import './MarketsList.scss';

type MarketsListProps = {
  hideHeader?: boolean;
  hideFilters?: boolean;
  searchText?: string;
  onClearSearch?: () => void;
  hideSearchTag?: boolean;
};

const MarketsList = ({
  hideHeader,
  hideFilters,
  searchText,
  onClearSearch,
  hideSearchTag,
}: MarketsListProps) => {
  const [filters, setFilters] = useState<MarketFilters>({
    search: searchText || '',
    provider: 'all',
    category: 'all',
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchText || '',
    }));
  }, [searchText]);

  const communityId = app.activeChainId() || '';
  const trpcUtils = trpc.useUtils();

  const {
    data: markets,
    isInitialLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDiscoverExternalMarketsQuery({
    filters,
    limit: 20,
    enabled: true,
  });

  const { data: subscribedMarketsData } =
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

  const subscribedMarkets = subscribedMarketsData?.pages.flatMap(
    (page) => page.results,
  );

  const savedMarketIds = useMemo(() => {
    return subscribedMarkets && subscribedMarkets.length > 0
      ? new Set<string>(subscribedMarkets.map((m) => m.slug))
      : new Set<string>();
  }, [subscribedMarkets]);

  const subscribeMarketMutation = trpc.community.subscribeMarket.useMutation({
    onSuccess: () => {
      notifySuccess('Subscribed to market successfully!');
      void trpcUtils.community.getMarkets.invalidate({
        community_id: communityId,
      });
    },
    onError: (err) => {
      notifyError(`Failed to subscribe: ${err.message}`);
    },
  });

  const unsubscribeMarketMutation =
    trpc.community.unsubscribeMarket.useMutation({
      onSuccess: () => {
        notifySuccess('Unsubscribed from market successfully!');
        void trpcUtils.community.getMarkets.invalidate({
          community_id: communityId,
        });
      },
      onError: (err) => {
        notifyError(`Failed to unsubscribe: ${err.message}`);
      },
    });

  const handleSubscribe = (market: Market) => {
    if (!communityId) {
      notifyError('Please select a community to subscribe to markets');
      return;
    }

    subscribeMarketMutation.mutate({
      community_id: communityId,
      provider: market.provider,
      slug: market.slug,
      question: market.question,
      category: market.category,
      start_time: market.startTime ?? new Date(),
      end_time: market.endTime ?? new Date(),
      status: market.status as 'open',
    });
  };

  const handleUnsubscribe = (market: Market) => {
    if (!communityId) {
      notifyError('Please select a community to unsubscribe from markets');
      return;
    }

    unsubscribeMarketMutation.mutate({
      community_id: communityId,
      slug: market.slug,
    });
  };

  const removeProviderFilter = () => {
    setFilters({
      ...filters,
      provider: 'all',
    });
  };

  const removeCategoryFilter = () => {
    setFilters({
      ...filters,
      category: 'all',
    });
  };

  return (
    <div className="MarketsList">
      {!hideHeader && <CWText type="h2">Markets</CWText>}
      {!hideFilters && (
        <div className="filters">
          {!hideSearchTag && searchText?.trim() && (
            <CWTag
              label={`Search: ${searchText?.trim()}`}
              type="filter"
              onCloseClick={onClearSearch}
            />
          )}
          {filters.provider !== 'all' && (
            <CWTag
              label={filters.provider}
              type="filter"
              onCloseClick={removeProviderFilter}
            />
          )}
          {filters.category !== 'all' && (
            <CWTag
              label={filters.category}
              type="filter"
              onCloseClick={removeCategoryFilter}
            />
          )}
        </div>
      )}
      {isInitialLoading ? (
        <div className="markets-loading">
          <CWCircleMultiplySpinner />
        </div>
      ) : !markets || markets.length === 0 ? (
        <div className="empty-placeholder">
          <CWText type="h2">No markets found</CWText>
          <CWText type="b2" className="empty-description">
            Try adjusting your search or filters to find markets.
          </CWText>
        </div>
      ) : (
        <>
          <div className="markets-grid">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                isSubscribed={savedMarketIds.has(market.slug)}
                onSubscribe={handleSubscribe}
                onUnsubscribe={handleUnsubscribe}
              />
            ))}
          </div>
          {isFetchingNextPage && (
            <div className="markets-loading">
              <CWCircleMultiplySpinner />
            </div>
          )}
          {hasNextPage && !isFetchingNextPage && (
            <div className="load-more-container">
              <CWButton
                label="See more"
                buttonType="tertiary"
                containerClassName="ml-auto"
                onClick={() => {
                  void fetchNextPage();
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketsList;
