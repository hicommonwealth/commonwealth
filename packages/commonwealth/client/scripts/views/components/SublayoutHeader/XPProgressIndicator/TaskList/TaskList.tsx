import clsx from 'clsx';
import React from 'react';

import Quests from './Quests';
import './TaskList.scss';

type TaskListProps = {
  className?: string;
};

const TaskList = ({ className }: TaskListProps) => {
  return (
    <div className={clsx('TaskList', className)}>
      <Quests />
    </div>
  );
};

export default TaskList;
