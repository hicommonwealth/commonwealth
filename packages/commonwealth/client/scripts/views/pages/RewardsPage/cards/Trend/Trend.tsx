import clsx from 'clsx';
import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import './Trend.scss';

interface TrendProps {
  value: number;
  showFromLastMonth?: boolean;
}

export const Trend = ({ value, showFromLastMonth = true }: TrendProps) => {
  return (
    <div
      className={clsx('Trend', {
        'trend-up': value > 0,
        'trend-down': value < 0,
      })}
    >
      <CWIcon
        iconName="triangle"
        weight="fill"
        className="trend-icon"
        iconSize="small"
      />
      <CWText type="b2" fontWeight="medium" className="percentage">
        {value}%
      </CWText>
      {showFromLastMonth && (
        <CWText type="b2" className="from-last-month">
          from last month
        </CWText>
      )}
    </div>
  );
};
