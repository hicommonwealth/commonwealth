import { z } from 'zod';

import { GetAllContests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';

type UseGetContestsQueryProps = z.infer<typeof GetAllContests.input>;

const CONTESTS_STALE_TIME = 10 * 1_000; // 10 s

const useGetContestsQuery = ({
  contest_id,
  community_id,
  running,
}: UseGetContestsQueryProps) => {
  return trpc.contest.getAllContests.useQuery(
    {
      contest_id,
      community_id,
      running,
    },
    { enabled: !!community_id, staleTime: CONTESTS_STALE_TIME },
  );
};

export default useGetContestsQuery;
