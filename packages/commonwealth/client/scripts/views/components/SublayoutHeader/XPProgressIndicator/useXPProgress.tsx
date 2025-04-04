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

  const { data: xpProgressions = [], isLoading: isLoadingXPProgression } =
    useGetXPs({
      user_id: user.id,
      from: moment().startOf('week').toDate(),
      to: moment().endOf('week').toDate(),
      enabled: user.isLoggedIn && xpEnabled,
    });

  const { data: questsList, isInitialLoading: isLoadingQuestsList } =
    useFetchQuestsQuery({
      cursor: 1,
      limit: 40,
      end_after: moment().startOf('week').toDate(),
      start_before: moment().endOf('week').toDate(),
      include_system_quests: includeSystemQuests,
      enabled: user.isLoggedIn && xpEnabled,
    });

  const allWeeklyQuests = (questsList?.pages || [])
    .flatMap((page) => page.results)
    .map((quest) => {
      const gainedXP =
        xpProgressions
          .filter((p) => p.quest_id === quest.id)
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
