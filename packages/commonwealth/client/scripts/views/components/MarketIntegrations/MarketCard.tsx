import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
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

  const getStatusTagType = (status: string): 'active' | 'new' | 'info' => {
    switch (status) {
      case 'open':
        return 'active';
      case 'closed':
        return 'new';
      case 'settled':
        return 'info';
      default:
        return 'info';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  };

  return (
    <div className="market-card">
      <div className="market-card-content">
        <div className="market-card-header">
          <div className="market-tags">
            <CWTag
              type="info"
              label={market.category}
              classNames="category-tag"
            />
            <CWTag
              type={getStatusTagType(market.status)}
              label={market.status.toUpperCase()}
              classNames="status-tag"
            />
          </div>
          <div className="market-provider">
            <span className="provider-badge">{market.provider}</span>
          </div>
        </div>

        <div className="market-question">
          <CWText fontWeight="semiBold" type="h5">
            {market.question}
          </CWText>
        </div>

        {market.startTime && market.endTime && (
          <div className="market-date-chip">
            <CWTag
              type="info"
              label={`From ${formatDate(market.startTime)} to ${formatDate(market.endTime)}`}
              classNames="date-tag"
            />
          </div>
        )}

        <div className="market-card-footer">
          <CWButton
            label={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            onClick={handleToggleSubscription}
            buttonType={isSubscribed ? 'destructive' : 'primary'}
          />
        </div>
      </div>
    </div>
  );
};
