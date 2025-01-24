import {
  navigateToCommunity,
  useCommonNavigate,
} from 'client/scripts/navigation/helpers';
import PricePercentageChange from 'client/scripts/views/components/TokenCard/PricePercentageChange';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { TradingMode } from 'client/scripts/views/modals/TradeTokenModel';
import clsx from 'clsx';
import { SupportedCurrencies } from 'helpers/currency';
import React from 'react';
import './TrendingToken.scss';

interface TokenCardProps {
  communityId: string;
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
  communityId,
  name,
  symbol,
  iconURL,
  pricePercentage24HourChange,
  mode,
  className,
  onCardBodyClick,
  onCTAClick,
}: TokenCardProps) => {
  const navigate = useCommonNavigate();

  const handleBodyClick = (e: React.MouseEvent) =>
    e.target === e.currentTarget && onCardBodyClick?.();

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('Trendingtoken', className)}
      onClick={handleBodyClick}
    >
      <div className="header">
        <img src={iconURL} className="image" alt={name} />
        <div className="info">
          <CWText className="name" type="h5" fontWeight="semiBold">
            {name}
          </CWText>
          <div className="detail">
            <CWText className="creator" type="caption">
              by
            </CWText>
            <CWText className="link" type="caption">
              {symbol}
            </CWText>
          </div>
        </div>
        <CWText className="price-change" type="h5" fontWeight="bold">
          <PricePercentageChange
            pricePercentage24HourChange={pricePercentage24HourChange}
          />
        </CWText>
      </div>
      <div className="action-buttons">
        <CWButton
          label="Community"
          buttonWidth="full"
          buttonType="secondary"
          onClick={() =>
            navigateToCommunity({
              navigate,
              path: '',
              chain: communityId,
            })
          }
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
