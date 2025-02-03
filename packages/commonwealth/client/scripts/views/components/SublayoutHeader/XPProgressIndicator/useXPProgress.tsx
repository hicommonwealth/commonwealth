import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useFetchQuestsQuery } from 'state/api/quest';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import './XPProgressIndicator.scss';

const WEEKLY_XP_GOAL = 400; // Hardcoded in client per product spec.

const useXPProgress = () => {
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
      enabled: user.isLoggedIn && xpEnabled,
    });

  const allWeeklyQuests = (questsList?.pages || [])
    .flatMap((page) => page.results)
    .map((quest) => ({
      ...quest,
      gainedXP:
        xpProgressions
          .filter((p) => p.quest_id === quest.id)
          .map((p) => p.xp_points)
          .reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) || 0,
      totalXP:
        (quest.action_metas || [])
          ?.map((action) => action.reward_amount)
          .reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) || 0,
    }));
  const allPendingWeeklyQuests = allWeeklyQuests.filter(
    (q) => q.totalXP !== q.gainedXP,
  );
  const upcomingWeeklyQuests = allPendingWeeklyQuests.filter((q) =>
    moment().isBefore(moment(q.start_date)),
  );
  const activeWeeklyQuests = allPendingWeeklyQuests.filter(
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
