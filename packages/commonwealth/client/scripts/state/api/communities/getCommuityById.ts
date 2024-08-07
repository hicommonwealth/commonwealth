import { Community } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';
import { queryClient } from '../config';

const COMMUNITIY_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetCommunityByIdProps = {
  id: string;
  includeNodeInfo?: boolean;
  enabled?: boolean;
};

export const invalidateAllQueriesForCommunity = async (communityId: string) => {
  const queryCache = queryClient.getQueryCache();

  // get all the query keys for this community
  const communityKeys = queryCache
    .getAll()
    .filter((cache) => {
      // Hacks: get all the query key for provided `communityId`
      const key: any = cache.queryKey;
      return Array.isArray(key[0]) && // check for `['community','getCommunity']`
        typeof key[1] === 'object' && // check for `{ input: {} }`
        key[1]?.input?.id === communityId // check for `{ input: { id: communityId } }`
        ? key
        : false;
    })
    .map((c) => c.queryKey);

  // invalidate all the query keys for this community
  if (communityKeys.length > 0) {
    await Promise.all(
      communityKeys.map(async (key) => {
        await queryClient.cancelQueries({
          queryKey: key,
        });
        await queryClient.invalidateQueries({
          queryKey: key,
        });
      }),
    );
  }
};

const useGetCommunityByIdQuery = ({
  id,
  includeNodeInfo = false,
  enabled,
}: UseGetCommunityByIdProps) => {
  return trpc.community.getCommunity.useQuery<z.infer<typeof Community>>(
    {
      id,
      include_node_info: includeNodeInfo,
    },
    {
      staleTime: COMMUNITIY_STALE_TIME,
      enabled,
    },
  );
};

export default useGetCommunityByIdQuery;
