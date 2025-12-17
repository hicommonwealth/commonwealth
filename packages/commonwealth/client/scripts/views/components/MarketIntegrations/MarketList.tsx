import React from 'react';
import { MarketListItem } from './MarketListItem';
import { Market } from './types';

interface MarketListProps {
  markets: Market[];
  selectedMarkets: Set<string>;
  savedMarketIds: Set<string>;
  onSelectionChange: (marketId: string, isSelected: boolean) => void;
}

export function MarketList({
  markets,
  selectedMarkets,
  savedMarketIds,
  onSelectionChange,
}: MarketListProps) {
  if (markets.length === 0) {
    return <p>No markets found.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {markets.map((market) => (
        <MarketListItem
          key={market.id}
          market={market}
          isSelected={selectedMarkets.has(market.id)}
          isSaved={savedMarketIds.has(market.id)}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </div>
  );
}
