import { GetQuests } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_QUESTS_STALE_TIME = 60 * 3_000; // 3 mins

type UseFetchQuestsProps = z.infer<typeof GetQuests.input> & {
  enabled?: boolean;
};

const useFetchQuestsQuery = ({
  community_id,
  end_before,
  end_after,
  start_after,
  start_before,
  limit,
  order_by,
  order_direction,
  enabled = true,
}: UseFetchQuestsProps) => {
  return trpc.quest.getQuests.useInfiniteQuery(
    {
      community_id,
      end_before,
      end_after,
      start_after,
      start_before,
      limit,
      order_by,
      order_direction,
    },
    {
      cacheTime: FETCH_QUESTS_STALE_TIME,
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

export { useFetchQuestsQuery };
