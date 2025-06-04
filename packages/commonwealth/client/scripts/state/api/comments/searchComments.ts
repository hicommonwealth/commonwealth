import { SearchComments } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const SEARCH_COMMENTS_STALE_TIME = 60 * 1_000; // 60 s

type SearchCommentsProps = z.infer<typeof SearchComments.input> & {
  enabled?: boolean;
};

const useSearchCommentsQuery = ({
  community_id,
  search,
  limit,
  order_by,
  order_direction,
  enabled = true,
}: SearchCommentsProps) => {
  return trpc.comment.searchComments.useInfiniteQuery(
    {
      community_id,
      search,
      limit,
      order_by,
      order_direction,
    },
    {
      staleTime: SEARCH_COMMENTS_STALE_TIME,
      enabled,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );
};

export default useSearchCommentsQuery;
