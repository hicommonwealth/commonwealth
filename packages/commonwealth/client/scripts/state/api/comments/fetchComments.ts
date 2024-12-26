import { GetComments } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const COMMENTS_STALE_TIME = 30 * 1_000; // 30 s

type FetchCommentsProps = z.infer<typeof GetComments.input> & {
  apiEnabled?: boolean;
};

const useFetchCommentsQuery = ({
  thread_id,
  comment_id,
  parent_id,
  include_reactions,
  apiEnabled = true,
}: FetchCommentsProps) => {
  return trpc.comment.getComments.useInfiniteQuery(
    {
      thread_id,
      comment_id,
      parent_id,
      include_reactions,
    },
    {
      staleTime: COMMENTS_STALE_TIME,
      enabled: apiEnabled,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );
};

export default useFetchCommentsQuery;
