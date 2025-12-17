import React from 'react';
import { MarketFilters } from './MarketFilters';
import { MarketList } from './MarketList';
import { useMarketData } from './useMarketData';

interface MarketSelectorProps {
  communityId: number;
}

export function MarketSelector({ communityId }: MarketSelectorProps) {
  const {
    filters,
    setFilters,
    markets,
    isLoading,
    selectedMarkets,
    handleSelectionChange,
    savedMarketIds,
    saveSelection,
    isSaving,
  } = useMarketData(communityId);

  return (
    <div>
      <h2>Find Markets</h2>
      <MarketFilters filters={filters} onFiltersChange={setFilters} />
      {isLoading ? (
        <p>Loading markets...</p>
      ) : (
        <MarketList
          markets={markets}
          selectedMarkets={selectedMarkets}
          savedMarketIds={savedMarketIds}
          onSelectionChange={handleSelectionChange}
        />
      )}
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={saveSelection}
          disabled={selectedMarkets.size === 0 || isSaving}
        >
          {isSaving ? 'Saving...' : `Save ${selectedMarkets.size} Markets`}
        </button>
      </div>
    </div>
  );
}
