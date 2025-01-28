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
      limit: 4,
      start_after: moment().startOf('week').toDate(),
      end_before: moment().endOf('week').toDate(),
      enabled: user.isLoggedIn && xpEnabled,
    });
  const allWeeklyQuests = (questsList?.pages || []).flatMap(
    (page) => page.results,
  );
  const pendingWeeklyQuests = allWeeklyQuests.filter(
    (q) => !xpProgressions.find((p) => p.quest_id === q.id),
  );
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
