import { GetXpsRanked } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_XP_RANKED_STALE_TIME = 60 * 3_000; // 3 mins
const FETCH_XP_RANKED_CACHE_TIME = 60 * 5_000; // 5 mins

type UseGetXPsRankedProps = Omit<
  z.infer<typeof GetXpsRanked.input>,
  'cursor'
> & {
  cursor?: number;
  enabled?: boolean;
};

const useGetXPsRanked = ({
  limit = 100,
  quest_id,
  search,
  user_id,
  enabled = true,
}: UseGetXPsRankedProps) => {
  return trpc.user.getXpsRanked.useInfiniteQuery(
    {
      limit,
      quest_id,
      search,
      user_id,
    },
    {
      enabled,
      initialCursor: 1,
      staleTime: FETCH_XP_RANKED_STALE_TIME,
      gcTime: FETCH_XP_RANKED_CACHE_TIME,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );
};

export default useGetXPsRanked;
