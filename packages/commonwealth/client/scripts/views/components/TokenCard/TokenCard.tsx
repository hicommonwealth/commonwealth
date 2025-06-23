import clsx from 'clsx';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import { useTokenPricing } from 'hooks/useTokenPricing';
import React from 'react';
import { useGetTokenStatsQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { TradingMode } from 'views/modals/TradeTokenModel';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import FormattedDisplayNumber from '../FormattedDisplayNumber/FormattedDisplayNumber';
import FractionalValue from '../FractionalValue';
import MarketCapProgress from './MarketCapProgress';
import PricePercentageChange from './PricePercentageChange';
import './TokenCard.scss';

interface TokenPricing {
  currentPrice: number;
  pricePercentage24HourChange: number;
  marketCapCurrent: number;
  marketCapGoal: number;
  isMarketCapGoalReached: boolean;
}

interface TokenStats {
  holder_count: number;
  volume_24h: number;
}

export interface TokenCardProps {
  token: LaunchpadToken;
  currency?: SupportedCurrencies;
  className?: string;
  onCTAClick?: (mode: TradingMode) => void;
  onCardBodyClick?: () => void;
}

const MAX_CHARS_FOR_LABELS = 9;

const TokenCard = ({
  token,
  currency = SupportedCurrencies.USD,
  className,
  onCardBodyClick,
  onCTAClick,
}: TokenCardProps) => {
  const { name, symbol, icon_url } = token;

  const { pricing } = useTokenPricing({ token }) as { pricing: TokenPricing };
  const { data: stats } = useGetTokenStatsQuery({
    token_address: token.token_address,
  }) as { data: TokenStats | undefined };

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

  const mode = pricing.isMarketCapGoalReached
    ? TradingMode.Swap
    : TradingMode.Buy;

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('TokenCard', className)}
      onClick={handleBodyClick}
    >
      <img src={icon_url || ''} className="image" onClick={handleBodyClick} />
      {/* name and price row */}
      <div className="basic-info" onClick={handleBodyClick}>
        <div className="col">
          {withTooltip(
            <CWText className="text-dark" type="h4" fontWeight="regular">
              {trimmedName}
            </CWText>,
            name,
            isNameTrimmed,
          )}
          {withTooltip(
            <CWText className="text-light">{trimmedSymbol}</CWText>,
            symbol,
            isSymbolTrimmed,
          )}
        </div>
        <div className="col">
          <CWText className="text-dark ml-auto" type="h4" fontWeight="regular">
            {currencySymbol}
            <FractionalValue
              value={pricing.currentPrice}
              type="h4"
              fontWeight="regular"
              className="text-dark"
            />
          </CWText>
          <CWText className="ml-auto text-light" type="caption">
            <PricePercentageChange
              pricePercentage24HourChange={pricing.pricePercentage24HourChange}
            />
          </CWText>
        </div>
      </div>
      <MarketCapProgress
        marketCap={{
          current: Number(pricing.marketCapCurrent),
          goal: Number(pricing.marketCapGoal),
          isCapped: Boolean(pricing.isMarketCapGoalReached),
        }}
        currency={currency}
        onBodyClick={handleBodyClick}
      />
      {stats && (
        <div className="token-stats" onClick={handleBodyClick}>
          <CWText type="caption" className="text-light">
            Holders {stats.holder_count}
          </CWText>
          <CWText type="caption" className="ml-auto text-light">
            Vol 24h {currencySymbol}
            <FormattedDisplayNumber
              value={stats.volume_24h}
              options={{ decimals: 1, useShortSuffixes: true }}
            />
          </CWText>
        </div>
      )}
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
