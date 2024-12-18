import clsx from 'clsx';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import numeral from 'numeral';
import React from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import './MarketCapProgress.scss';

interface MarketCapProgressProps {
  currency?: SupportedCurrencies;
  marketCap: { current: number; goal: number; isCapped: boolean };
  onBodyClick?: (e: React.MouseEvent) => void;
}

const MarketCapProgress = ({
  currency = SupportedCurrencies.USD,
  marketCap,
  onBodyClick,
}: MarketCapProgressProps) => {
  const currencySymbol = currencyNameToSymbolMap[currency];
  const progressPercentage = Math.floor(
    (marketCap.current / marketCap.goal) * 100,
  );

  return (
    <div className="MarketCapProgress" onClick={onBodyClick}>
      <progress
        className={clsx('goal-progress', { isCapped: marketCap.isCapped })}
        value={progressPercentage}
        max={100}
      />
      <div className="prices">
        <CWText className="text-dark caps" type="caption">
          MCAP {currencySymbol}
          {numeral(marketCap.current).format('0.0a')} | Goal {currencySymbol}
          {numeral(marketCap.goal).format('0.0a')}
        </CWText>
        {marketCap.isCapped && (
          <CWIcon iconName="rocketLaunch" className="token-capped-icon" />
        )}
      </div>
    </div>
  );
};

export default MarketCapProgress;
