import clsx from 'clsx';
import React from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import moment from 'moment';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
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

  const user = useUserStore();
  const { data = [], isLoading } = useGetXPs({
    user_id: user.id,
    from: moment().startOf('week').toDate(),
    to: moment().endOf('week').toDate(),
    enabled: user.isLoggedIn,
  });

  if (isLoading) return;

  return (
    <div className={clsx('TaskList', className)}>
      {isWindowExtraSmall && (
        <WeeklyProgressGoal
          className="weekly-progress-bar"
          progress={sampleData.weeklyGoal}
        />
      )}
      <Quests
        quests={data
          .filter((task) => task.quest_id)
          .map((task) => ({
            daysLeftBeforeEnd: 4, // TODO: where to get time diff from
            id: task.quest_id || 0,
            // TODO: where to get this url from
            imageURL:
              'https://cdn.pixabay.com/photo/2023/01/08/14/22/sample-7705350_640.jpg',
            title: task.event_name,
            xpPoints: task.xp_points,
          }))}
      />
    </div>
  );
};

export default TaskList;
