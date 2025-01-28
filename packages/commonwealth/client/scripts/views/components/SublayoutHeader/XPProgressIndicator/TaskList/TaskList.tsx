import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import moment from 'moment';
import React from 'react';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import WeeklyProgressGoal from '../WeeklyProgressGoal';
import useXPProgress from '../useXPProgress';
import Quests from './Quests';
import './TaskList.scss';

type TaskListProps = {
  className?: string;
};

const TaskList = ({ className }: TaskListProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  const {
    weeklyGoal,
    isLoadingQuestsList,
    isLoadingXPProgression,
    pendingWeeklyQuests,
  } = useXPProgress();

  if (isLoadingXPProgression) return;

  return (
    <div className={clsx('TaskList', className)}>
      {isWindowExtraSmall && (
        <WeeklyProgressGoal
          className="weekly-progress-bar"
          progress={weeklyGoal}
        />
      )}
      {isLoadingQuestsList ? (
        <CWCircleMultiplySpinner />
      ) : (
        <Quests
          quests={pendingWeeklyQuests.map((quest) => ({
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
