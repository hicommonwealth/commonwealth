import { LaunchpadTokenView, ThreadTokenView } from '@hicommonwealth/schemas';
import { getDefaultContestImage } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import clsx from 'clsx';
import {
  currencyNameToSymbolMap,
  SupportedFiatCurrencies,
} from 'helpers/currency';
import { useTokenPricing } from 'hooks/useTokenPricing';
import React from 'react';
import { useFlag } from 'shared/hooks/useFlag';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { TradingMode } from 'views/modals/TradeTokenModel';
import z from 'zod';
import { CWTag } from '../component_kit/new_designs/CWTag';
import FractionalValue from '../FractionalValue';
import MarketCapProgress from './MarketCapProgress';
import PricePercentageChange from './PricePercentageChange';
import './TokenCard.scss';
import TokenHolderStats from './TokenHolderStats';

interface TokenPricing {
  currentPrice: number;
  pricePercentage24HourChange: number;
  marketCapCurrent: number;
  marketCapGoal: number;
  isMarketCapGoalReached: boolean;
}

export type TokenType =
  | z.infer<typeof LaunchpadTokenView>
  | z.infer<typeof ThreadTokenView>;
export interface TokenCardProps {
  token: TokenType;
  currency?: SupportedFiatCurrencies;
  className?: string;
  onCTAClick?: (mode: TradingMode) => void;
  onCardBodyClick?: () => void;
}

const MAX_CHARS_FOR_LABELS = 9;

const TokenCard = ({
  token,
  currency = SupportedFiatCurrencies.USD,
  className,
  onCardBodyClick,
  onCTAClick,
}: TokenCardProps) => {
  const navigate = useCommonNavigate();
  const { name, symbol, icon_url } = token;
  const tokenizedThreadsEnabled = useFlag('tokenizedThreads');

  const { pricing } = useTokenPricing({ token }) as {
    pricing: TokenPricing;
  };

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

  const mode =
    token.token_type === 'launchpad'
      ? pricing.isMarketCapGoalReached
        ? TradingMode.Swap
        : TradingMode.Buy
      : 'View thread';

  const handleCTAClick = () => {
    if (mode === 'View thread') {
      token.thread_id && navigate(`/discussion/${token.thread_id}`, {}, null);
    } else {
      onCTAClick?.(mode);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('TokenCard', className)}
      onClick={handleBodyClick}
    >
      <img
        src={icon_url || getDefaultContestImage()}
        className="image"
        onClick={handleBodyClick}
      />
      {tokenizedThreadsEnabled && (
        <CWTag type="info" label={token.token_type} classNames="capitalize" />
      )}
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
      <TokenHolderStats
        tokenAddress={token.token_address}
        currency={currency}
        className="token-stats"
        onClick={handleBodyClick}
      />
      {/* action cta */}
      <CWButton
        label={mode}
        containerClassName="action-btn"
        buttonWidth="full"
        buttonType="secondary"
        buttonAlt="green"
        onClick={handleCTAClick}
      />
    </div>
  );
};

export default TokenCard;
