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
      start_after: moment().startOf('week').toDate(),
      end_before: moment().endOf('week').toDate(),
      enabled: user.isLoggedIn && xpEnabled,
    });

  const allWeeklyQuests = (questsList?.pages || []).flatMap(
    (page) => page.results,
  );
  const allPendingWeeklyQuests = allWeeklyQuests.filter(
    (q) => !xpProgressions.find((p) => p.quest_id === q.id),
  );
  const upcomingWeeklyQuests = allPendingWeeklyQuests.filter((q) =>
    moment().isBefore(moment(q.start_date)),
  );
  const activeWeeklyQuests = allPendingWeeklyQuests.filter((q) =>
    moment().isSameOrAfter(moment(q.start_date)),
  );
  const pendingWeeklyQuests = {
    upcomingWeeklyQuests,
    activeWeeklyQuests,
  };
  const weeklyGoal = {
    current: Math.min(
      xpProgressions
        .map((x) => x.xp_points)
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
