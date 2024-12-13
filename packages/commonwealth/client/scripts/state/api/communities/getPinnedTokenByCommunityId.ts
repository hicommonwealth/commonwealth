import { GetPinnedTokens } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_PINNED_TOKEN_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetPinnedTokensByCommunityIdProps = Omit<
  z.infer<typeof GetPinnedTokens.input>,
  'community_ids'
> & {
  community_ids: string[];
  enabled?: boolean;
};

const useGetPinnedTokensByCommunityId = ({
  community_ids,
  with_chain_node,
  enabled,
}: UseGetPinnedTokensByCommunityIdProps) => {
  return trpc.community.getPinnedTokens.useQuery(
    {
      community_ids: community_ids.join(','),
      with_chain_node,
    },
    {
      cacheTime: FETCH_PINNED_TOKEN_STALE_TIME,
      enabled,
    },
  );
};

export default useGetPinnedTokensByCommunityId;
