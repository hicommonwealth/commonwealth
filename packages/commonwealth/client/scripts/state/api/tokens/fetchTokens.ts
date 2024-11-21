import { GetTokens } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_TOKENS_STALE_TIME = 60 * 3_000; // 3 mins

type UseFetchTokensProps = z.infer<typeof GetTokens.input> & {
  enabled?: boolean;
};

const useFetchTokensQuery = ({
  limit,
  order_by,
  order_direction,
  search,
  with_stats = false,
  enabled = true,
}: UseFetchTokensProps) => {
  return trpc.token.getTokens.useInfiniteQuery(
    {
      limit,
      order_by,
      order_direction,
      search,
      with_stats,
    },
    {
      staleTime: FETCH_TOKENS_STALE_TIME,
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

export default useFetchTokensQuery;
