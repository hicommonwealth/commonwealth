import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { MarketFilters } from './MarketFilters';
import { MarketList } from './MarketList';
import './MarketSelector.scss';
import { useMarketData } from './useMarketData';

interface MarketSelectorProps {
  communityId?: string;
  hideHeader?: boolean;
}

export const MarketSelector = ({
  communityId,
  hideHeader = false,
}: MarketSelectorProps) => {
  const {
    filters,
    setFilters,
    markets,
    categories,
    isLoading,
    savedMarketIds,
    onSubscribe,
    onUnsubscribe,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMarketData(communityId);

  return (
    <section className="MarketSelector">
      {!hideHeader && (
        <div className="markets-header">
          <CWText type="h3" fontWeight="bold" className="markets-title">
            Find Markets
          </CWText>
          <CWText type="b1" className="markets-subtitle">
            Discover and subscribe to prediction markets from multiple providers
          </CWText>
        </div>
      )}

      <MarketFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />

      {isLoading ? (
        <div className="markets-loading">
          <CWCircleMultiplySpinner />
        </div>
      ) : (
        <>
          <MarketList
            markets={markets}
            savedMarketIds={savedMarketIds}
            onSubscribe={onSubscribe}
            onUnsubscribe={onUnsubscribe}
          />
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
    </section>
  );
};
