import { z } from 'zod';

import { GetAllContests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';

type UseGetContestsQueryProps = z.infer<typeof GetAllContests.input>;

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
    // { enabled: !!community_id },
    // TODO: When we hook up community, fix this, also make sure its behind a FF.
    { enabled: false },
  );
};

export default useGetContestsQuery;
