import * as schemas from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod/v4';

const GET_THREADS_STALE_TIME = 10 * 1_000; // 10 s

const useGetThreadsQuery = ({
  community_id,
  limit,
  order_by,
  order_direction,
  stage,
  topic_id,
  from_date,
  to_date,
  archived,
  contestAddress,
  status,
  withXRecentComments = 0,
  enabled = true,
}: z.infer<(typeof schemas.GetThreads)['input']> & {
  enabled?: boolean;
}) => {
  return trpc.thread.getThreads.useInfiniteQuery(
    {
      community_id,
      limit,
      order_by,
      order_direction,
      stage,
      topic_id,
      from_date,
      to_date,
      archived,
      contestAddress,
      status,
      withXRecentComments,
    },
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: GET_THREADS_STALE_TIME,
      enabled,
    },
  );
};

export default useGetThreadsQuery;
