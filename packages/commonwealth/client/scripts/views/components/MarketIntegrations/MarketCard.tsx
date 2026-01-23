import React, { useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './MarketCard.scss';
import { getExternalMarketUrl, Market, MarketProvider } from './types';

import defaultMarketImage from 'assets/img/default-market-image.svg';

// Normalized market data that the card expects
export interface MarketCardData {
  slug: string;
  provider: MarketProvider;
  question: string;
  category: string;
  status: string;
  imageUrl?: string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  subTitle?: string | null;
}

interface MarketCardProps {
  market: MarketCardData;
  isSubscribed: boolean;
  onSubscribe?: (market: MarketCardData) => void;
  onUnsubscribe?: (market: MarketCardData) => void;
  isLoading?: boolean;
}

// Helper to convert frontend Market type to MarketCardData
export const toMarketCardData = (market: Market): MarketCardData => ({
  slug: market.slug,
  provider: market.provider,
  question: market.question,
  category: market.category,
  status: market.status,
  imageUrl: market.imageUrl,
  startTime: market.startTime,
  endTime: market.endTime,
  subTitle: market.subTitle,
});

export const MarketCard = ({
  market,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  isLoading = false,
}: MarketCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleToggleSubscription = () => {
    if (isSubscribed && onUnsubscribe) {
      onUnsubscribe(market);
    } else if (!isSubscribed && onSubscribe) {
      onSubscribe(market);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const imageSrc =
    !imageError && market.imageUrl ? market.imageUrl : defaultMarketImage;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  };

  // Get date display - prefer subTitle for Kalshi, otherwise use start/end dates
  const getDateDisplay = () => {
    if (market.subTitle) {
      return market.subTitle;
    }
    if (market.startTime && market.endTime) {
      return `${formatDate(market.startTime)} - ${formatDate(market.endTime)}`;
    }
    if (market.endTime) {
      return `Ends ${formatDate(market.endTime)}`;
    }
    return null;
  };

  const dateDisplay = getDateDisplay();
  const externalUrl = getExternalMarketUrl(
    market.provider,
    market.slug,
    market.question,
  );

  // Determine button label and type
  const getButtonConfig = () => {
    if (isSubscribed) {
      return {
        label: 'Unsubscribe',
        buttonType: 'tertiary' as const,
      };
    }
    return {
      label: 'Subscribe',
      buttonType: 'primary' as const,
    };
  };

  const buttonConfig = getButtonConfig();
  const hasAction = isSubscribed ? !!onUnsubscribe : !!onSubscribe;

  return (
    <div className={`market-card ${isSubscribed ? 'subscribed' : ''}`}>
      <div className="market-card-image">
        <img
          src={imageSrc}
          alt={market.question}
          onError={handleImageError}
          loading="lazy"
        />
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`provider-badge provider-${market.provider}`}
          aria-label={`View on ${market.provider}`}
        >
          {market.provider}
          <CWIcon iconName="externalLink" iconSize="small" />
        </a>
      </div>

      <div className="market-card-content">
        <div className="market-card-question">
          <CWText fontWeight="semiBold" type="h5">
            {market.question}
          </CWText>
        </div>

        <div className="market-card-info">
          {dateDisplay && (
            <span className="info-item date">
              <CWIcon iconName="clock" iconSize="small" />
              {dateDisplay}
            </span>
          )}
          <span className="info-item category">{market.category}</span>
          <span className={`info-item status status-${market.status}`}>
            {market.status}
          </span>
        </div>

        {hasAction && (
          <div className="market-card-actions">
            <CWButton
              label={buttonConfig.label}
              onClick={handleToggleSubscription}
              buttonType={buttonConfig.buttonType}
              buttonHeight="sm"
              buttonWidth="full"
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
