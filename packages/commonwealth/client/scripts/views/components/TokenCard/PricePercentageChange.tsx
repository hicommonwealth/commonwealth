import clsx from 'clsx';
import React from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import './PricePercentageChange.scss';

interface PricePercentageChangeProps {
  pricePercentage24HourChange: number;
  alignment?: 'left' | 'right';
  className?: string;
  show24Hour?: boolean;
  useIcon?: boolean;
  tokenCard?: boolean;
}

const PricePercentageChange = ({
  pricePercentage24HourChange,
  alignment = 'right',
  className,
  show24Hour = true,
  useIcon = false,
  tokenCard = false,
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
        {...(tokenCard
          ? { fontWeight: 'semiBold', type: 'h3' }
          : { type: 'caption' })}
      >
        {useIcon ? (
          pricePercentage24HourChange >= 0 ? (
            <CWIcon iconName="arrowUpHalfGreen" />
          ) : (
            <CWIcon iconName="arrowDownHalfOrange" />
          )
        ) : pricePercentage24HourChange >= 0 ? (
          '+'
        ) : (
          ''
        )}
        &nbsp;{pricePercentage24HourChange}%
      </CWText>{' '}
      {show24Hour && <span>&nbsp;24hr</span>}
    </CWText>
  );
};

export default PricePercentageChange;
