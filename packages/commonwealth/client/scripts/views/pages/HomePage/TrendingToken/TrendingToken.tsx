import {
  navigateToCommunity,
  useCommonNavigate,
} from 'client/scripts/navigation/helpers';
import PricePercentageChange from 'client/scripts/views/components/TokenCard/PricePercentageChange';
import { TokenCardProps } from 'client/scripts/views/components/TokenCard/TokenCard';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import clsx from 'clsx';
import { useTokenPricing } from 'hooks/useTokenPricing';
import React from 'react';
import { smartTrim } from 'shared/utils';
import { TradingMode } from 'views/modals/TradeTokenModel';
import './TrendingToken.scss';

const TrendingToken = ({
  className,
  onCardBodyClick,
  onCTAClick,
  token,
}: TokenCardProps) => {
  const { name, symbol, icon_url, community_id } = token;
  const navigate = useCommonNavigate();

  const { pricing } = useTokenPricing({ token });

  const handleBodyClick = (e: React.MouseEvent) =>
    e.target === e.currentTarget && onCardBodyClick?.();

  const mode = pricing.isMarketCapGoalReached
    ? TradingMode.Swap
    : TradingMode.Buy;

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('Trendingtoken', className)}
      onClick={handleBodyClick}
    >
      <div className="header">
        <div className="token-data">
          <img src={icon_url || ''} className="image" alt={name} />
          <div className="info">
            <CWText fontWeight="semiBold">{smartTrim(name, 12)}</CWText>
            <div className="detail">
              <CWText className="creator" type="caption">
                by
              </CWText>
              <CWText className="link" type="caption" fontWeight="medium">
                {symbol}
              </CWText>
            </div>
          </div>
        </div>
        <PricePercentageChange
          pricePercentage24HourChange={pricing.pricePercentage24HourChange}
          show24Hour={false}
          useIcon
          tokenCard
        />
      </div>
      <div className="action-buttons">
        <CWButton
          label="Community"
          buttonWidth="full"
          buttonHeight="sm"
          buttonType="secondary"
          onClick={() =>
            navigateToCommunity({
              navigate,
              path: '',
              chain: community_id,
            })
          }
        />
        <CWButton
          label="Buy"
          buttonWidth="full"
          buttonHeight="sm"
          buttonType="primary"
          onClick={() => onCTAClick?.(mode)}
        />
      </div>
    </div>
  );
};

export default TrendingToken;
