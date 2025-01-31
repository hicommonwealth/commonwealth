import clsx from 'clsx';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import React, { ReactNode } from 'react';
import { TradingMode } from '../../modals/TradeTokenModel';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import FractionalValue from '../FractionalValue';
import MarketCapProgress from './MarketCapProgress';
import PricePercentageChange from './PricePercentageChange';
import './TokenCard.scss';

export interface TokenCardProps {
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

const MAX_CHARS_FOR_LABELS = 9;

const TokenCard = ({
  name,
  symbol,
  iconURL,
  currency = SupportedCurrencies.USD,
  marketCap,
  price,
  pricePercentage24HourChange,
  mode,
  className,
  onCardBodyClick,
  onCTAClick,
}: TokenCardProps) => {
  const currencySymbol = currencyNameToSymbolMap[currency];

  const handleBodyClick = (e: React.MouseEvent) =>
    e.target === e.currentTarget && onCardBodyClick?.();

  const isNameTrimmed = name.length > MAX_CHARS_FOR_LABELS;
  const trimmedName = isNameTrimmed
    ? name.slice(0, MAX_CHARS_FOR_LABELS) + '...'
    : name;
  const isSymbolTrimmed = symbol.length > MAX_CHARS_FOR_LABELS;
  const trimmedSymbol = isSymbolTrimmed
    ? symbol.slice(0, MAX_CHARS_FOR_LABELS) + '...'
    : symbol;

  const withOptionalTooltip = (
    children: ReactNode,
    content: string,
    shouldDisplay,
  ) => {
    if (!shouldDisplay) return children;

    return (
      <CWTooltip
        placement="bottom"
        content={content}
        renderTrigger={(handleInteraction) => (
          <span
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          >
            {children}
          </span>
        )}
      />
    );
  };

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
          {withOptionalTooltip(
            <CWText className="text-dark" type="h4" fontWeight="regular">
              {trimmedName}
            </CWText>,
            name,
            isNameTrimmed,
          )}
          {withOptionalTooltip(
            <CWText className="text-light">{trimmedSymbol}</CWText>,
            symbol,
            isSymbolTrimmed,
          )}
        </div>
        <div className="col">
          <CWText className="text-dark ml-auto" type="h4" fontWeight="regular">
            {currencySymbol}
            <FractionalValue
              value={price}
              type="h4"
              fontWeight="regular"
              className="text-dark"
            />
          </CWText>
          <CWText className="ml-auto text-light" type="caption">
            <PricePercentageChange
              pricePercentage24HourChange={pricePercentage24HourChange}
            />
          </CWText>
        </div>
      </div>
      {/* market cap row */}
      <MarketCapProgress
        marketCap={marketCap}
        currency={currency}
        onBodyClick={handleBodyClick}
      />
      {/* action cta */}
      <CWButton
        label={mode}
        containerClassName="action-btn"
        buttonWidth="full"
        buttonType="secondary"
        buttonAlt="green"
        onClick={() => onCTAClick?.(mode)}
      />
    </div>
  );
};

export default TokenCard;
