import { GetTokenizedThreadsAllowed } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

type UseGetTokenizedThreadsAllowedQuery = z.infer<
  typeof GetTokenizedThreadsAllowed.input
> & {
  enabled?: boolean;
};

const useGetTokenizedThreadsAllowedQuery = (
  params: UseGetTokenizedThreadsAllowedQuery,
) => {
  return trpc.launchpadToken.geTokenizedThreadsAllowed.useQuery(
    {
      community_id: params.community_id,
      topic_id: params.topic_id,
    },
    {
      enabled: !!params.community_id && !!params.topic_id,
    },
  );
};

export default useGetTokenizedThreadsAllowedQuery;
