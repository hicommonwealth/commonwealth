import { z } from 'zod';

import { GetAllContests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';

type UseGetContestsQueryProps = z.infer<typeof GetAllContests.input> & {
  enabled: boolean;
};

const useGetContestsQuery = ({
  contest_id,
  community_id,
  running,
  enabled,
}: UseGetContestsQueryProps) => {
  return trpc.contest.getAllContests.useQuery(
    {
      contest_id,
      community_id,
      running,
    },
    { enabled: enabled && !!community_id },
  );
};

export default useGetContestsQuery;
