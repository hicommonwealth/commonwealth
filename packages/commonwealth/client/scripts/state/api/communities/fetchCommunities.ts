import { GetCommunities } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const COMMUNITIY_STALE_TIME = 60 * 3_000; // 3 mins

type UseFetchCommunitiesProps = z.infer<typeof GetCommunities.input> & {
  enabled?: boolean;
};

const useFetchCommunitiesQuery = ({
  base,
  has_groups,
  include_node_info,
  relevance_by,
  network,
  stake_enabled,
  tag_ids,
  limit = 50,
  order_direction = 'DESC',
  order_by = 'thread_count',
  enabled = true,
}: UseFetchCommunitiesProps) => {
  return trpc.community.getCommunities.useInfiniteQuery(
    {
      limit: limit,
      include_node_info,
      order_by,
      order_direction,
      base,
      network,
      stake_enabled,
      tag_ids,
      has_groups,
      relevance_by,
      ...(tag_ids &&
        tag_ids?.length > 0 && {
          tag_ids: tag_ids.join(','),
        }),
    },
    {
      staleTime: COMMUNITIY_STALE_TIME,
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

export default useFetchCommunitiesQuery;
