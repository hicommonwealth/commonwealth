import { QuestAction } from 'client/scripts/helpers/quest';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import React from 'react';
import CWCircleMultiplySpinner from 'views/components/component_kit/CWCircleMultiplySpinner';
import TotalQuestXPTag from 'views/pages/QuestDetails/TotalQuestXPTag';
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
  } = useXPProgress({ includeSystemQuests: true }); // dont show system quests in xp progression bar

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
              communityId: quest.community_id || '',
              imageURL: quest.image_url,
              title: quest.name,
              isCompleted: quest.isCompleted,
              xpPointsElement: (
                <TotalQuestXPTag
                  questId={quest.id}
                  questStartDate={new Date(quest.start_date)}
                  questEndDate={new Date(quest.end_date)}
                  questActions={(quest.action_metas as QuestAction[]) || []}
                />
              ),
            }))}
          />
          <Quests
            headerLabel="Later this week"
            hideSeeAllBtn
            quests={pendingWeeklyQuests.upcomingWeeklyQuests.map((quest) => ({
              endDate: new Date(quest.end_date),
              startDate: new Date(quest.start_date),
              id: quest.id,
              communityId: quest.community_id || '',
              imageURL: quest.image_url,
              title: quest.name,
              isCompleted: quest.isCompleted,
              xpPointsElement: (
                <TotalQuestXPTag
                  questId={quest.id}
                  questStartDate={new Date(quest.start_date)}
                  questEndDate={new Date(quest.end_date)}
                  questActions={(quest.action_metas as QuestAction[]) || []}
                  hideGainedXp
                />
              ),
            }))}
          />
        </>
      )}
    </div>
  );
};

export default TaskList;
