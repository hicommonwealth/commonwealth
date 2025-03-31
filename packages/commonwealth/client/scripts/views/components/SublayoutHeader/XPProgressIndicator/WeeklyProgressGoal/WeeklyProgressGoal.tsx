import clsx from 'clsx';
import React from 'react';

import { CWText } from '../../../component_kit/cw_text';
import './WeeklyProgressGoal.scss';

type WeeklyProgressGoalProps = {
  className?: string;
  progress: {
    current: number;
    target: number;
  };
};

const WeeklyProgressGoal = ({
  className,
  progress,
}: WeeklyProgressGoalProps) => {
  const currentProgress = parseInt(
    ((progress.current / progress.target) * 100).toFixed(0),
  );

  return (
    <div className={clsx('WeeklyProgressGoal', className)}>
      <div className="header">
        <CWText type="caption" fontWeight="semiBold">
          Weekly Aura Target
        </CWText>
        <CWText type="caption" fontWeight="semiBold">
          {progress.current} / {progress.target} Aura
        </CWText>
      </div>
      <progress className="progress-bar" value={currentProgress} max={100} />
    </div>
  );
};

export default WeeklyProgressGoal;
