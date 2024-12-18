import { GetCommunities } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_COMMUNITIES_STALE_TIME = 60 * 3_000; // 3 mins

type UseFetchCommunitiesProps = z.infer<typeof GetCommunities.input> & {
  enabled?: boolean;
};

const useFetchCommunitiesQuery = ({
  base,
  has_groups,
  include_node_info,
  include_last_30_day_thread_count,
  relevance_by,
  network,
  stake_enabled,
  eth_chain_id,
  cosmos_chain_id,
  community_type,
  tag_ids,
  limit = 50,
  order_direction = 'DESC',
  order_by = 'lifetime_thread_count',
  enabled = true,
}: UseFetchCommunitiesProps) => {
  return trpc.community.getCommunities.useInfiniteQuery(
    {
      limit: limit,
      include_node_info,
      include_last_30_day_thread_count,
      order_by,
      order_direction,
      base,
      network,
      stake_enabled,
      eth_chain_id,
      cosmos_chain_id,
      community_type,
      tag_ids,
      has_groups,
      relevance_by,
      ...(tag_ids &&
        tag_ids?.length > 0 && {
          tag_ids: tag_ids.join(','),
        }),
    },
    {
      staleTime: FETCH_COMMUNITIES_STALE_TIME,
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
