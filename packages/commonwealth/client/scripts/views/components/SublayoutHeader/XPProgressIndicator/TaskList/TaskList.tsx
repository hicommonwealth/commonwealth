import clsx from 'clsx';
import React from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useFetchQuestsQuery } from 'state/api/quest';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
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

  const xpEnabled = useFlag('xp');
  const user = useUserStore();
  const { data: xpProgressions = [], isLoading } = useGetXPs({
    user_id: user.id,
    from: moment().startOf('week').toDate(),
    to: moment().endOf('week').toDate(),
    enabled: user.isLoggedIn && xpEnabled,
  });
  const { data: questsList, isInitialLoading } = useFetchQuestsQuery({
    cursor: 1,
    limit: 4,
    start_after: moment().startOf('week').toDate(),
    end_before: moment().endOf('week').toDate(),
    enabled: user.isLoggedIn && xpEnabled,
  });
  const quests = (questsList?.pages || []).flatMap((page) => page.results);
  const pendingQuests = quests.filter(
    (q) => !xpProgressions.find((p) => p.quest_id === q.id),
  );

  if (isLoading) return;

  return (
    <div className={clsx('TaskList', className)}>
      {isWindowExtraSmall && (
        <WeeklyProgressGoal
          className="weekly-progress-bar"
          progress={sampleData.weeklyGoal}
        />
      )}
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <Quests
          quests={pendingQuests.map((quest) => ({
            daysLeftBeforeEnd: moment(quest.end_date).diff(moment(), 'days'),
            id: quest.id,
            imageURL: quest.image_url,
            title: quest.name,
            xpPoints:
              (quest.action_metas || [])
                ?.map((action) => action.reward_amount)
                .reduce(
                  (accumulator, currentValue) => accumulator + currentValue,
                  0,
                ) || 0,
          }))}
        />
      )}
    </div>
  );
};

export default TaskList;
