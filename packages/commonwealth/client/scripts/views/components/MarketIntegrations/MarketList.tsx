import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { MarketCard } from './MarketCard';
import './MarketList.scss';
import { Market } from './types';

interface MarketListProps {
  markets: Market[];
  savedMarketIds: Set<string>;
  onSubscribe: (market: Market) => void;
  onUnsubscribe: (market: Market) => void;
}

export const MarketList = ({
  markets,
  savedMarketIds,
  onSubscribe,
  onUnsubscribe,
}: MarketListProps) => {
  if (markets.length === 0) {
    return (
      <div className="markets-empty-state">
        <CWText type="h5" className="empty-state-title">
          No markets found
        </CWText>
        <CWText type="b2" className="empty-state-description">
          Try adjusting your filters or search terms to find markets.
        </CWText>
      </div>
    );
  }

  return (
    <div className="market-list">
      {markets.map((market) => (
        <MarketCard
          key={market.id}
          market={market}
          isSubscribed={savedMarketIds.has(market.slug)}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />
      ))}
    </div>
  );
};
