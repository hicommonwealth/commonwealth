import moment from 'moment';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import FormattedDisplayNumber from 'views/components/FormattedDisplayNumber/FormattedDisplayNumber';

import './PrizeDisplay.scss';

export interface PrizeDisplayProps {
  /** The token amount value */
  tokenAmount: number;
  /** The token symbol (e.g., 'ETH', 'USDC') */
  tokenSymbol: string;
  /** The USD equivalent value (optional) */
  usdAmount?: number | null;
  /** The prize position (1st, 2nd, 3rd, etc.) */
  position: number;
  /** Currency symbol for USD display (defaults to '$') */
  currencySymbol?: string;
  /** Additional CSS class name */
  className?: string;
  /** Custom label instead of ordinal position */
  customLabel?: string;
}

export const PrizeDisplay = ({
  tokenAmount,
  tokenSymbol,
  usdAmount,
  position,
  currencySymbol = '$',
  className,
  customLabel,
}: PrizeDisplayProps) => {
  const label = customLabel || `${moment.localeData().ordinal(position)} Prize`;

  return (
    <div className={`prize-row ${className || ''}`}>
      <CWText className="label" fontWeight="bold">
        {label}
      </CWText>
      <div className="amount-with-usd">
        <CWText fontWeight="bold" className="token-amount">
          <FormattedDisplayNumber
            fontWeight="bold"
            value={tokenAmount}
            options={{ decimals: 4, useShortSuffixes: false }}
          />
          &nbsp;{tokenSymbol}
        </CWText>
        {usdAmount !== null && usdAmount !== undefined && (
          <CWText type="caption" className="usd-equivalent">
            <FormattedDisplayNumber
              value={usdAmount}
              options={{
                currencySymbol,
                decimals: 2,
                useShortSuffixes: false,
              }}
            />
          </CWText>
        )}
      </div>
    </div>
  );
};

export default PrizeDisplay;
