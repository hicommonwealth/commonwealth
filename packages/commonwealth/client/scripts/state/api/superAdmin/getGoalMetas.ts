import { notifyError } from 'client/scripts/controllers/app/notifications';
import { trpc } from 'utils/trpcClient';

const GOALS_STALE_TIME = 60 * 60 * 1000;

const useGetGoalMetasQuery = ({
  apiEnabled = true,
}: {
  apiEnabled?: boolean;
}) => {
  return trpc.superAdmin.getCommunityGoalMetas.useQuery(undefined, {
    staleTime: GOALS_STALE_TIME,
    enabled: apiEnabled,
    onError: (error) => {
      notifyError(`Error fetching goals: ${error.message}`);
    },
  });
};

export default useGetGoalMetasQuery;
