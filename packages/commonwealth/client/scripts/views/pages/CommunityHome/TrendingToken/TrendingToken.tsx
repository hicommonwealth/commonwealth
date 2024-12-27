import PricePercentageChange from 'client/scripts/views/components/TokenCard/PricePercentageChange';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { TradingMode } from 'client/scripts/views/modals/TradeTokenModel';
import clsx from 'clsx';
import { SupportedCurrencies } from 'helpers/currency';
import React from 'react';
import './TrendingToken.scss';

interface TokenCardProps {
  name: string;
  symbol: string;
  iconURL: string;
  currency?: SupportedCurrencies;
  marketCap: { current: number; goal: number; isCapped: boolean };
  price: number;
  pricePercentage24HourChange: number;
  mode: TradingMode.Buy | TradingMode.Swap;
  className?: string;
  onCTAClick?: (mode: TradingMode) => void;
  onCardBodyClick?: () => void;
}

const TreandingToken = ({
  name,
  symbol,
  iconURL,
  pricePercentage24HourChange,
  mode,
  className,
  onCardBodyClick,
  onCTAClick,
}: TokenCardProps) => {
  const handleBodyClick = (e: React.MouseEvent) =>
    e.target === e.currentTarget && onCardBodyClick?.();

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('TokenCard', className)}
      onClick={handleBodyClick}
    >
      {/* Icon and Name Row */}
      <div className="header">
        <img src={iconURL} className="image" alt={name} />
        <div className="info">
          <CWText className="name" type="h4" fontWeight="bold">
            {name}
          </CWText>
          <CWText className="creator" type="caption">
            by {symbol}
          </CWText>
        </div>
        <CWText className="price-change" type="h5" fontWeight="bold">
          <PricePercentageChange
            pricePercentage24HourChange={pricePercentage24HourChange}
          />
        </CWText>
      </div>
      {/* Action Buttons */}
      <div className="action-buttons">
        <CWButton
          label="Community"
          buttonWidth="full"
          buttonType="secondary"
          onClick={() => {}}
        />
        <CWButton
          label="Buy"
          buttonWidth="full"
          buttonType="primary"
          onClick={() => onCTAClick?.(mode)}
        />
      </div>
    </div>
  );
};

export default TreandingToken;
