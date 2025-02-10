import clsx from 'clsx';
import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import { calculateTimeLeft } from './utils';

import './CWCountDownTimer.scss';

interface CWCountDownTimerProps {
  finishTime: string;
  isActive: boolean;
  className?: string;
  labelPostfix?: string;
}

const CWCountDownTimer = ({
  finishTime,
  isActive,
  className,
  labelPostfix,
}: CWCountDownTimerProps) => {
  const { label, status } = calculateTimeLeft(finishTime, isActive);

  return (
    <div className={clsx('CWCountDownTimer', status, className)}>
      <CWIcon iconName="timer" iconSize="small" weight="bold" />
      <CWText fontWeight="medium">
        {label}
        {labelPostfix ? ` ${labelPostfix}` : ''}
      </CWText>
    </div>
  );
};

export default CWCountDownTimer;
