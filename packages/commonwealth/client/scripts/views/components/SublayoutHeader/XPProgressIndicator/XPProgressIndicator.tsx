import clsx from 'clsx';
import React from 'react';

import useUserStore from 'state/ui/user';
import { CWText } from '../../component_kit/cw_text';
import './XPProgressIndicator.scss';
import { XPProgressIndicatorMode, XPProgressIndicatorProps } from './types';

const XPProgressIndicator = ({
  mode = XPProgressIndicatorMode.Detailed,
  className,
}: XPProgressIndicatorProps) => {
  const sampleData = {
    weeklyGoal: {
      current: 170,
      target: 400,
    },
  };

  const currentProgress = parseInt(
    (
      (sampleData.weeklyGoal.current / sampleData.weeklyGoal.target) *
      100
    ).toFixed(0),
  );

  const user = useUserStore();

  if (!user.isLoggedIn) return;

  const weeklyProgress = (
    <div className={clsx('weekly-progress', className)}>
      <div className="header">
        <CWText type="caption" fontWeight="semiBold">
          Weekly XP Goal
        </CWText>
        <CWText type="caption" fontWeight="semiBold">
          {sampleData.weeklyGoal.current} / {sampleData.weeklyGoal.target} XP
        </CWText>
      </div>
      <progress className="progress-bar" value={currentProgress} max={100} />
    </div>
  );

  return (
    <button className={clsx('XPProgressIndicator', className, mode)}>
      {mode === XPProgressIndicatorMode.Compact ? (
        <CWText type="b2" fontWeight="semiBold">
          XP
        </CWText>
      ) : (
        weeklyProgress
      )}
    </button>
  );
};

export default XPProgressIndicator;
