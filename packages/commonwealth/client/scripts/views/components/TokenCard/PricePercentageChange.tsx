import clsx from 'clsx';
import React from 'react';
import { CWText } from '../component_kit/cw_text';
import './PricePercentageChange.scss';

interface PricePercentageChangeProps {
  pricePercentage24HourChange: number;
  alignment?: 'left' | 'right';
  className?: string;
}

const PricePercentageChange = ({
  pricePercentage24HourChange,
  alignment = 'right',
  className,
}: PricePercentageChangeProps) => {
  return (
    <CWText
      type="caption"
      className={clsx(
        'text-light',
        { 'ml-auto': alignment === 'right' },
        { 'mr-auto': alignment === 'left' },
        className,
      )}
    >
      <CWText
        className={clsx(
          'PricePercentageChange',
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
  );
};

export default PricePercentageChange;
