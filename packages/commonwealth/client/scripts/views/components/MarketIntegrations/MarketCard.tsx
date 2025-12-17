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

  const formatMarketDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleDateString() : 'N/A';
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
        {market.outcomes && market.outcomes.length > 0 && (
          <CWText type="b3">Outcomes: {market.outcomes.join(', ')}</CWText>
        )}
        <CWText type="b3">Provider: {market.provider}</CWText>
        <CWText type="b3">Category: {market.category}</CWText>
        <CWText type="b3">Status: {market.status}</CWText>
        <CWText type="b3">
          Start Time: {formatMarketDate(market.startTime)}
        </CWText>
        <CWText type="b3">End Time: {formatMarketDate(market.endTime)}</CWText>
      </div>
      <div className="market-card__footer">
        <button onClick={handleToggleSubscription}>
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>
    </CWCard>
  );
};
