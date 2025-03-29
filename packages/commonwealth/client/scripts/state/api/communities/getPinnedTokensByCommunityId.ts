import { GetPinnedTokens } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_PINNED_TOKEN_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetPinnedTokensByCommunityIdProps = z.infer<
  typeof GetPinnedTokens.input
> & {
  enabled?: boolean;
};

const useGetPinnedTokensByCommunityId = ({
  community_ids,
  with_chain_node,
  with_price,
  limit,
  order_by,
  order_direction,
  enabled,
}: UseGetPinnedTokensByCommunityIdProps) => {
  return trpc.community.getPinnedTokens.useInfiniteQuery(
    {
      community_ids,
      with_chain_node,
      with_price,
      limit,
      order_by,
      order_direction,
    },
    {
      cacheTime: FETCH_PINNED_TOKEN_STALE_TIME,
      enabled,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    },
  );
};

export default useGetPinnedTokensByCommunityId;
