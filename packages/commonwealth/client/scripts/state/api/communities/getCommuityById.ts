import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { getQueryKey } from '@trpc/react-query';
import { trpc, trpcQueryUtils } from 'utils/trpcClient';
import { z } from 'zod';
import { queryClient } from '../config';

const COMMUNITIY_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetCommunityByIdProps = {
  id: string;
  includeNodeInfo?: boolean;
  includeGroups?: boolean;
  includeMcpServers?: boolean;
  enabled?: boolean;
};

const getQueryKeysForCommunity = (communityId: string) => {
  return [
    {
      id: communityId,
      include_node_info: true,
    },
    {
      id: communityId,
      include_node_info: false,
    },
  ];
};

export const updateCommunityThreadCount = (
  communityId: string,
  type: 'increment' | 'decrement',
  isVotingThread: boolean,
  trpcUtils: ReturnType<typeof trpc.useUtils>,
) => {
  // get all the query keys for this community
  const queryKeys = getQueryKeysForCommunity(communityId);
  const count = type === 'increment' ? 1 : -1;

  queryKeys.map((key) => {
    const queryKey = getQueryKey(trpc.community.getCommunity, key);

    // update react query cache
    const rqData =
      queryClient.getQueryData<z.infer<typeof ExtendedCommunity>>(queryKey);
    if (rqData) {
      queryClient.setQueryData(queryKey, () => {
        rqData.lifetime_thread_count =
          (rqData.lifetime_thread_count || 0) + count;
        return { ...rqData };
      });
    }

    // update trpc cache
    const trpcData = trpcUtils.community.getCommunity.getData(key);
    if (
      trpcData &&
      trpcData.lifetime_thread_count &&
      trpcData.lifetime_thread_count >= 0
    ) {
      trpcData.lifetime_thread_count += count;
      trpcUtils.community.getCommunity.setData(key, trpcData);
    }
  });

  // invalidate all communities cache (as updating multiple filters cache would be messy)
  trpcUtils.community.getCommunities.invalidate().catch(console.error);
};

export const invalidateAllQueriesForCommunity = async (communityId: string) => {
  // get all the query keys for this community
  const queryKeys = getQueryKeysForCommunity(communityId);

  // invalidate all the query keys for this community
  if (queryKeys.length > 0) {
    await Promise.all(
      queryKeys.map(async (key) => {
        const params = {
          queryKey: getQueryKey(trpc.community.getCommunity, key),
        };
        await queryClient.cancelQueries(params);
        await queryClient.invalidateQueries(params);
      }),
    );
  }
};

export const getCommunityByIdQuery = async (
  communityId: string,
  includeNodeInfo = false,
  includeMcpServers = false,
) => {
  return await trpcQueryUtils.community.getCommunity.fetch(
    {
      id: communityId,
      include_node_info: includeNodeInfo,
      include_mcp_servers: includeMcpServers,
    },
    {
      staleTime: COMMUNITIY_STALE_TIME,
    },
  );
};

const useGetCommunityByIdQuery = ({
  id,
  includeNodeInfo = false,
  includeGroups = false,
  includeMcpServers = false,
  enabled,
}: UseGetCommunityByIdProps) => {
  return trpc.community.getCommunity.useQuery(
    {
      id,
      include_node_info: includeNodeInfo,
      include_groups: includeGroups,
      include_mcp_servers: includeMcpServers,
    },
    {
      staleTime: COMMUNITIY_STALE_TIME,
      enabled,
    },
  );
};

export default useGetCommunityByIdQuery;
