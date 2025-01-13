import clsx from 'clsx';
import React from 'react';

import useUserStore from 'state/ui/user';
import { CWText } from '../../component_kit/cw_text';
import './XPProgressIndicator.scss';

type XPProgressIndicatorProps = {
  className?: string;
};

const XPProgressIndicator = ({ className }: XPProgressIndicatorProps) => {
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

  return (
    <button className={clsx('XPProgressIndicator', className)}>
      <div className="header">
        <CWText type="caption" fontWeight="semiBold">
          Weekly XP Goal
        </CWText>
        <CWText type="caption" fontWeight="semiBold">
          {sampleData.weeklyGoal.current} / {sampleData.weeklyGoal.target} XP
        </CWText>
      </div>
      <progress className="progress-bar" value={currentProgress} max={100} />
    </button>
  );
};

export default XPProgressIndicator;
