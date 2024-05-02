import clsx from 'clsx';
import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import { calculateTimeLeft } from './utils';

import './ContestCountdown.scss';

interface ContestCountdownProps {
  finishTime: string;
  isActive: boolean;
}

const ContestCountdown = ({ finishTime, isActive }: ContestCountdownProps) => {
  const { label, status } = calculateTimeLeft(finishTime, isActive);

  return (
    <div className={clsx('ContestCountdown', status)}>
      <CWIcon iconName="timer" iconSize="small" weight="bold" />
      <CWText fontWeight="medium">{label}</CWText>
    </div>
  );
};

export default ContestCountdown;
