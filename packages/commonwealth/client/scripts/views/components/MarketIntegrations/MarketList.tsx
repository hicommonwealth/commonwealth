import React from 'react';
import { MarketCard } from './MarketCard';
import './MarketList.scss';
import { Market } from './types';

interface MarketListProps {
  markets: Market[];
  savedMarketIds: Set<string>;
  onSubscribe: (market: Market) => void;
  onUnsubscribe: (market: Market) => void;
}

export function MarketList({
  markets,
  savedMarketIds,
  onSubscribe,
  onUnsubscribe,
}: MarketListProps) {
  if (markets.length === 0) {
    return <p>No markets found.</p>;
  }

  return (
    <div className="market-list">
      {markets.map((market) => (
        <MarketCard
          key={market.id}
          market={market}
          isSubscribed={savedMarketIds.has(market.id)}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />
      ))}
    </div>
  );
}
