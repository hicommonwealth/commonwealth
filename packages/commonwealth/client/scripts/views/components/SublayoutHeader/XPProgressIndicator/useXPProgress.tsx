import { calculateTotalXPForQuestActions, QuestAction } from 'helpers/quest';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useFetchQuestsQuery } from 'state/api/quest';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import './XPProgressIndicator.scss';

const WEEKLY_XP_GOAL = 100; // Hardcoded in client per product spec.

type UseXPProgress = {
  includeSystemQuests?: boolean;
};

const useXPProgress = ({ includeSystemQuests }: UseXPProgress) => {
  const xpEnabled = useFlag('xp');
  const user = useUserStore();
  const currentWeekStart = moment().startOf('week');
  const currentWeekEnd = moment().endOf('week');

  const { data: xpProgressions = [], isLoading: isLoadingXPProgression } =
    useGetXPs({
      user_id: user.id,
      from: currentWeekStart.toDate(),
      to: currentWeekEnd.toDate(),
      enabled: user.isLoggedIn && xpEnabled,
    });

  const { data: questsList, isInitialLoading: isLoadingQuestsList } =
    useFetchQuestsQuery({
      cursor: 1,
      limit: 40,
      end_after: currentWeekStart.toDate(),
      start_before: currentWeekEnd.toDate(),
      include_system_quests: includeSystemQuests,
      enabled: user.isLoggedIn && xpEnabled,
    });

  const allWeeklyQuests = (questsList?.pages || [])
    .flatMap((page) => page.results)
    .map((quest) => {
      // Filter XP logs for this quest
      const questXpLogs = xpProgressions.filter((p) => p.quest_id === quest.id);

      // For system quests (negative IDs), only include XP earned in current week
      const isSystemQuest = quest.id < 0;
      const validXpLogs = isSystemQuest
        ? questXpLogs.filter((xpLog) => {
            // Check if the XP was earned in the current week
            const xpEarnedDate = moment(xpLog.created_at);
            return (
              xpEarnedDate.isSameOrAfter(currentWeekStart) &&
              xpEarnedDate.isSameOrBefore(currentWeekEnd)
            );
          })
        : questXpLogs;

      const gainedXP =
        validXpLogs
          .map((p) => p.xp_points)
          .reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) || 0;

      const totalUserXP = calculateTotalXPForQuestActions({
        questActions: (quest.action_metas as QuestAction[]) || [],
        isUserReferred: !!user.referredByAddress,
        questStartDate: new Date(quest.start_date),
        questEndDate: new Date(quest.end_date),
      });
      return {
        ...quest,
        gainedXP,
        totalUserXP,
        isCompleted: gainedXP === totalUserXP,
      };
    });
  const upcomingWeeklyQuests = allWeeklyQuests.filter((q) =>
    moment().isBefore(moment(q.start_date)),
  );
  const activeWeeklyQuests = allWeeklyQuests.filter(
    (q) =>
      moment().isSameOrAfter(moment(q.start_date)) &&
      moment().isBefore(moment(q.end_date)),
  );
  const pendingWeeklyQuests = {
    upcomingWeeklyQuests,
    activeWeeklyQuests,
  };
  const weeklyGoal = {
    current: Math.min(
      allWeeklyQuests
        .map((x) => x.gainedXP)
        .reduce((accumulator, currentValue) => accumulator + currentValue, 0) ||
        0,
      WEEKLY_XP_GOAL,
    ),
    target: WEEKLY_XP_GOAL,
  };

  return {
    weeklyGoal,
    pendingWeeklyQuests,
    isLoadingXPProgression,
    isLoadingQuestsList,
  };
};

export default useXPProgress;
