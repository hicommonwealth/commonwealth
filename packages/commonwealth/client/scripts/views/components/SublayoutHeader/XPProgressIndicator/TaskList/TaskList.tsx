import clsx from 'clsx';
import React from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import WeeklyProgressGoal from '../WeeklyProgressGoal';
import Quests from './Quests';
import './TaskList.scss';

type TaskListProps = {
  className?: string;
};

const TaskList = ({ className }: TaskListProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  const sampleData = {
    weeklyGoal: {
      current: 170,
      target: 400,
    },
  };

  return (
    <div className={clsx('TaskList', className)}>
      {isWindowExtraSmall && (
        <WeeklyProgressGoal
          className="weekly-progress-bar"
          progress={sampleData.weeklyGoal}
        />
      )}
      <Quests />
    </div>
  );
};

export default TaskList;
