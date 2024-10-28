import clsx from 'clsx';
import React from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './TokenCard.scss';

interface TokenCardProps {
  name: string;
  symbol: string;
  iconURL: string;
  currency?: 'USD';
  marketCap: { current: number; goal: number };
  price: string;
  pricePercentage24HourChange: number;
  mode: 'buy' | 'swap';
  className?: string;
  onCTAClick?: () => void;
  onCardBodyClick?: () => void;
}

const currentNameToSymbol = {
  USD: '$',
};

const TokenCard = ({
  name,
  symbol,
  iconURL,
  currency = 'USD',
  marketCap,
  price,
  pricePercentage24HourChange,
  mode,
  className,
  onCardBodyClick,
  onCTAClick,
}: TokenCardProps) => {
  const currencySymbol = currentNameToSymbol[currency];
  const isCapped = marketCap.current === marketCap.goal;
  const progressPercentage = Math.floor(
    (marketCap.current / marketCap.goal) * 100,
  );

  const handleBodyClick = (e: React.MouseEvent) =>
    e.target === e.currentTarget && onCardBodyClick?.();

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('TokenCard', className)}
      onClick={handleBodyClick}
    >
      <img src={iconURL} className="image" onClick={handleBodyClick} />
      {/* name and price row */}
      <div className="basic-info" onClick={handleBodyClick}>
        <div className="col">
          <CWText className="text-dark" type="h4" fontWeight="regular">
            {name}
          </CWText>
          <CWText className="text-light">{symbol}</CWText>
        </div>
        <div className="col">
          <CWText className="text-dark ml-auto" type="h4" fontWeight="regular">
            {currencySymbol}
            {price}
          </CWText>
          <CWText className="ml-auto text-light" type="caption">
            <CWText
              className={clsx(
                'price-change',
                { negative: pricePercentage24HourChange < 0 },
                { positive: pricePercentage24HourChange >= 0 },
              )}
              type="caption"
            >
              {pricePercentage24HourChange >= 0 ? '+' : ''}
              {pricePercentage24HourChange}%
            </CWText>{' '}
            &nbsp;24hr
          </CWText>
        </div>
      </div>
      {/* market cap row */}
      <div className="market-cap" onClick={handleBodyClick}>
        <progress
          className={clsx('goal-progress', { isCapped })}
          value={progressPercentage}
          max={100}
        />
        <div className="prices">
          <CWText className="text-dark caps" type="caption">
            MCAP {currencySymbol}
            {marketCap.current} | Goal {currencySymbol}
            {marketCap.goal}
          </CWText>
          {isCapped && (
            <CWIcon iconName="rocketLaunch" className="token-capped-icon" />
          )}
        </div>
      </div>
      {/* action cta */}
      <CWButton
        label={mode}
        containerClassName="action-btn"
        buttonWidth="full"
        buttonType="secondary"
        buttonAlt="green"
        onClick={onCTAClick}
      />
    </div>
  );
};

export default TokenCard;
