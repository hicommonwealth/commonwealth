import * as schemas from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const SEARCH_THREADS_STALE_TIME = 10 * 1_000; // 10 s

const useSearchThreadsQuery = ({
  community_id,
  search_term,
  limit,
  order_by,
  order_direction,
  thread_title_only,
  include_count,
  enabled = true,
}: z.infer<(typeof schemas.SearchThreads)['input']> & {
  enabled?: boolean;
}) => {
  return trpc.thread.searchThreads.useInfiniteQuery(
    {
      community_id,
      search_term,
      limit,
      order_by,
      order_direction,
      thread_title_only,
      include_count,
    },
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: SEARCH_THREADS_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchThreadsQuery;
