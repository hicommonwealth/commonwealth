import { z } from 'zod';

import { GetAllContests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { useFlag } from '../../../hooks/useFlag';

type UseGetContestsQueryProps = z.infer<typeof GetAllContests.input>;

const useGetContestsQuery = ({
  contest_id,
  community_id,
  running,
}: UseGetContestsQueryProps) => {
  const enabled = useFlag('contest');
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
