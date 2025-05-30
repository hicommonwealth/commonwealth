import * as schemas from '@hicommonwealth/schemas';
import Thread from 'client/scripts/models/Thread';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const GET_THREADS_STALE_TIME = 100 * 1_000; // 100 s

const useGetActiveThreadsQuery = ({
  community_id,
  threads_per_topic,
  withXRecentComments = 0,
  enabled = true,
}: z.infer<(typeof schemas.GetActiveThreads)['input']> & {
  enabled?: boolean;
}) => {
  return trpc.thread.getActiveThreads.useQuery(
    {
      community_id,
      threads_per_topic,
      withXRecentComments,
    },
    {
      staleTime: GET_THREADS_STALE_TIME,
      enabled,
      select: (data) => data.map((t) => new Thread(t)),
    },
  );
};

export default useGetActiveThreadsQuery;
