import { z } from 'zod';

import { GetAllContests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';

type UseGetContestsQueryProps = z.infer<typeof GetAllContests.input> & {
  shouldPolling?: boolean;
  fetchAll?: boolean;
  search?: string;
};

const CONTESTS_STALE_TIME = 10 * 1_000; // 10 s

const useGetContestsQuery = ({
  contest_id,
  community_id,
  running,
  shouldPolling = false,
  fetchAll = false,
  search,
}: UseGetContestsQueryProps) => {
  return trpc.contest.getAllContests.useQuery(
    {
      contest_id,
      community_id,
      running,
      search,
    },
    {
      enabled: fetchAll ? true : !!community_id,
      staleTime: CONTESTS_STALE_TIME,
      refetchInterval: (query) => {
        if (!shouldPolling) {
          return false;
        }

        const doesEveryContestManagerHasContest = query.state.data?.every(
          (contestManager) =>
            Array.isArray(contestManager?.contests) &&
            contestManager?.contests?.length > 0,
        );

        return doesEveryContestManagerHasContest ? false : CONTESTS_STALE_TIME;
      },
    },
  );
};

export default useGetContestsQuery;
