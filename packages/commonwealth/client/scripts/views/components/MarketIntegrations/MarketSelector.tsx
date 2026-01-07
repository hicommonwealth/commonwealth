import React from 'react';
import { MarketFilters } from './MarketFilters';
import { MarketList } from './MarketList';
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
    <div>
      <h2>Find Markets</h2>
      <MarketFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />
      {isLoading ? (
        <p>Loading markets...</p>
      ) : (
        <MarketList
          markets={markets}
          savedMarketIds={savedMarketIds}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />
      )}
    </div>
  );
}
