import { z } from 'zod';

import { schemas } from '@hicommonwealth/core';
import { trpc } from 'utils/trpcClient';

type UseGetContestsQueryProps = z.infer<
  typeof schemas.queries.GetAllContests.input
>;

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
    { enabled: !!community_id },
  );
};

export default useGetContestsQuery;
