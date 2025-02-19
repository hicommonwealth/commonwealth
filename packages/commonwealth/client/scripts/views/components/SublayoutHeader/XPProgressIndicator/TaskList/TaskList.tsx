import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
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
        <>
          <Quests
            headerLabel="Weekly Quests"
            quests={pendingWeeklyQuests.activeWeeklyQuests.map((quest) => ({
              endDate: new Date(quest.end_date),
              startDate: new Date(quest.start_date),
              id: quest.id,
              imageURL: quest.image_url,
              title: quest.name,
              isCompleted: quest.isCompleted,
              xpPoints: { gained: quest.gainedXP, total: quest.totalUserXP },
            }))}
          />
          <Quests
            headerLabel="Later this week"
            hideSeeAllBtn
            quests={pendingWeeklyQuests.upcomingWeeklyQuests.map((quest) => ({
              endDate: new Date(quest.end_date),
              startDate: new Date(quest.start_date),
              id: quest.id,
              imageURL: quest.image_url,
              title: quest.name,
              isCompleted: quest.isCompleted,
              xpPoints: { gained: quest.gainedXP, total: quest.totalUserXP },
            }))}
          />
        </>
      )}
    </div>
  );
};

export default TaskList;
