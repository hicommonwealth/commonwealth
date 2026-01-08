import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { MarketFilters } from './MarketFilters';
import { MarketList } from './MarketList';
import './MarketSelector.scss';
import { useMarketData } from './useMarketData';

interface MarketSelectorProps {
  communityId: string;
}

export function MarketSelector({ communityId }: MarketSelectorProps) {
  const {
    filters,
    setFilters,
    markets,
    categories,
    isLoading,
    savedMarketIds,
    onSubscribe,
    onUnsubscribe,
  } = useMarketData(communityId);

  return (
    <section className="MarketSelector">
      <div className="markets-header">
        <CWText type="h3" fontWeight="bold" className="markets-title">
          Find Markets
        </CWText>
        <CWText type="b1" className="markets-subtitle">
          Discover and subscribe to prediction markets from multiple providers
        </CWText>
      </div>

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
        <MarketList
          markets={markets}
          savedMarketIds={savedMarketIds}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />
      )}
    </section>
  );
}
