import React from 'react';

import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';

import './MarketCard.scss';
import { Market } from './types';

interface MarketCardProps {
  market: Market;
  isSubscribed: boolean;
  onSubscribe: (market: Market) => void;
  onUnsubscribe: (market: Market) => void;
}

export const MarketCard = ({
  market,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
}: MarketCardProps) => {
  const handleToggleSubscription = () => {
    if (isSubscribed) {
      onUnsubscribe(market);
    } else {
      onSubscribe(market);
    }
  };

  return (
    <CWCard className="market-card" elevation="elevation-1" interactive>
      {market.imageUrl && (
        <div className="market-card__image-container">
          <img
            src={market.imageUrl}
            alt={market.question}
            className="market-card__image"
          />
        </div>
      )}
      <div className="market-card__header">
        <CWText color="white" fontWeight="semiBold">
          {market.question}
        </CWText>
      </div>
      <div className="market-card__body">
        <CWText>Provider: {market.provider}</CWText>
        <CWText>Category: {market.category}</CWText>
      </div>
      <div className="market-card__footer">
        {isSubscribed ? (
          <button
            style={{ backgroundColor: 'red' }}
            onClick={handleToggleSubscription}
          >
            Unsubscribe
          </button>
        ) : (
          <button onClick={handleToggleSubscription}>Subscribe</button>
        )}
      </div>
    </CWCard>
  );
};
