import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { getQueryKey } from '@trpc/react-query';
import axios from 'axios';
import { BASE_API_PATH, trpc } from 'utils/trpcClient';
import { z } from 'zod';
import { queryClient } from '../config';

const COMMUNITIY_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetCommunityByIdProps = {
  id: string;
  includeNodeInfo?: boolean;
  includeGroups?: boolean;
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

export const EXCEPTION_CASE_VANILLA_getCommunityById = async (
  communityId: string,
  includeNodeInfo = false,
): Promise<z.infer<typeof ExtendedCommunity> | undefined> => {
  // make trpc query key for this request
  const queryKey = getQueryKey(trpc.community.getCommunity, {
    id: communityId,
    include_node_info: includeNodeInfo,
  });

  // if community already exists in cache, return that
  const cachedCommunity = queryClient.getQueryData<
    z.infer<typeof ExtendedCommunity> | undefined
  >(queryKey);
  if (cachedCommunity) {
    return cachedCommunity;
  }

  // HACK: with @trpc/react-query v10.x, we can't directly call an endpoint outside of 'react-context'
  // with this way the api can be used in non-react files. This should be cleaned up when we migrate
  // to @trpc/react-query v11.x
  const response = await axios.get(
    // eslint-disable-next-line max-len
    `${BASE_API_PATH}/community.getCommunity?batch=1&input=%7B%220%22%3A%7B%22id%22%3A%22${communityId}%22%2C%22include_node_info%22%3A${includeNodeInfo}%7D%7D`,
  );
  const fetchedCommunity = response?.data[0]?.result?.data as z.infer<
    typeof ExtendedCommunity
  >;

  // add response in cache
  queryClient.setQueryData(queryKey, fetchedCommunity);

  return fetchedCommunity;
};

const useGetCommunityByIdQuery = ({
  id,
  includeNodeInfo = false,
  includeGroups = false,
  enabled,
}: UseGetCommunityByIdProps) => {
  return trpc.community.getCommunity.useQuery(
    {
      id,
      include_node_info: includeNodeInfo,
      include_groups: includeGroups,
    },
    {
      staleTime: COMMUNITIY_STALE_TIME,
      enabled,
    },
  );
};

export default useGetCommunityByIdQuery;
