import { GetTokenizedThreadsAllowed } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const GET_TOKENIZED_THREADS_ALLOWED_TIME = 60 * 1_000; // 1 min

type UseGetTokenizedThreadsAllowedQuery = z.infer<
  typeof GetTokenizedThreadsAllowed.input
> & {
  enabled?: boolean;
};

const useGetTokenizedThreadsAllowedQuery = (
  params: UseGetTokenizedThreadsAllowedQuery,
) => {
  return trpc.LaunchpadToken.geTokenizedThreadsAllowed.useQuery(
    {
      community_id: params.community_id,
      topic_id: params.topic_id,
    },
    {
      enabled: !!params.community_id && !!params.topic_id,
      staleTime: GET_TOKENIZED_THREADS_ALLOWED_TIME,
    },
  );
};

export default useGetTokenizedThreadsAllowedQuery;
