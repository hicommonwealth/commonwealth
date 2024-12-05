import { z } from 'zod';

import { GetAllContests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';

type UseGetContestsQueryProps = z.infer<typeof GetAllContests.input> & {
  shouldPolling?: boolean;
  fetchAll?: boolean;
};

const CONTESTS_STALE_TIME = 10 * 1_000; // 10 s

const useGetContestsQuery = ({
  contest_id,
  community_id,
  running,
  shouldPolling = false,
  fetchAll = false,
}: UseGetContestsQueryProps) => {
  return trpc.contest.getAllContests.useQuery(
    {
      contest_id,
      community_id,
      running,
    },
    {
      enabled: fetchAll ? true : !!community_id,
      staleTime: CONTESTS_STALE_TIME,
      refetchInterval: (data) => {
        if (!shouldPolling) {
          return false;
        }

        const doesEveryContestManagerHasContest = data?.every(
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
