import { GetComments } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const COMMENTS_STALE_TIME = 30 * 1_000; // 30 s

type FetchCommentsProps = Omit<
  z.infer<typeof GetComments.input>,
  'is_chat_mode'
> & {
  apiEnabled?: boolean;
};

const useFetchCommentsQuery = ({
  thread_id,
  comment_id,
  parent_id,
  include_reactions,
  include_spam_comments,
  order_by,
  apiEnabled = true,
}: FetchCommentsProps) => {
  const is_chat_mode = order_by === 'oldest' && !parent_id;

  return trpc.comment.getComments.useInfiniteQuery(
    {
      thread_id,
      comment_id,
      parent_id,
      order_by,
      include_reactions,
      include_spam_comments,
      is_chat_mode,
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
