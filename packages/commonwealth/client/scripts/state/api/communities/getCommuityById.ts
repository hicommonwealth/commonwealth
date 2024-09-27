import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ThreadStage } from 'models/types';
import { trpc, trpcVanilla } from 'utils/trpcClient';
import { z } from 'zod';
import { queryClient } from '../config';

const COMMUNITIY_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetCommunityByIdProps = {
  id: string;
  includeNodeInfo?: boolean;
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

export const updateThreadCountsByStageChange = (
  communityId: string,
  currentStage: ThreadStage,
  updatedStage: ThreadStage,
  trpcUtils: ReturnType<typeof trpc.useUtils>,
) => {
  // get all the query keys for this community
  const queryKeys = getQueryKeysForCommunity(communityId);

  // calc change by value
  let changeBy = 0;
  if (currentStage === ThreadStage.Voting) changeBy--;
  if (updatedStage === ThreadStage.Voting) changeBy++;

  queryKeys.map((key) => {
    const queryKey = trpc.community.getCommunity.getQueryKey(key);

    // update react query cache
    const rqData =
      queryClient.getQueryData<z.infer<typeof ExtendedCommunity>>(queryKey);
    if (rqData) {
      queryClient.setQueryData(queryKey, () => {
        rqData.numVotingThreads = (rqData.numVotingThreads || 0) + changeBy;
        return { ...rqData };
      });
    }

    // update trpc cache
    const trpcData = trpcUtils.community.getCommunity.getData(key);
    if (trpcData && trpcData.numVotingThreads >= 0) {
      trpcData.numVotingThreads += changeBy;
      trpcUtils.community.getCommunity.setData(key, trpcData);
    }
  });
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
    const queryKey = trpc.community.getCommunity.getQueryKey(key);

    // update react query cache
    const rqData =
      queryClient.getQueryData<z.infer<typeof ExtendedCommunity>>(queryKey);
    if (rqData) {
      queryClient.setQueryData(queryKey, () => {
        rqData.lifetime_thread_count =
          (rqData.lifetime_thread_count || 0) + count;
        if (isVotingThread) {
          rqData.numVotingThreads = (rqData.numVotingThreads || 0) + count;
        }
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
          queryKey: trpc.community.getCommunity.getQueryKey(key),
        };
        await queryClient.cancelQueries(params);
        await queryClient.invalidateQueries(params);
      }),
    );
  }
};

export const getCommunityById = async (
  communityId: string,
  includeNodeInfo = false,
): Promise<z.infer<typeof ExtendedCommunity> | undefined> => {
  // make trpc query key for this request
  const queryKey = trpc.community.getCommunity.getQueryKey({
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

  const community = await trpcVanilla.community.getCommunity.query({
    id: communityId,
    include_node_info: includeNodeInfo,
  });

  // add response in cache
  queryClient.setQueryData(queryKey, community);

  return community as z.infer<typeof ExtendedCommunity>;
};

const useGetCommunityByIdQuery = ({
  id,
  includeNodeInfo = false,
  enabled,
}: UseGetCommunityByIdProps) => {
  return trpc.community.getCommunity.useQuery(
    {
      id,
      include_node_info: includeNodeInfo,
    },
    {
      staleTime: COMMUNITIY_STALE_TIME,
      enabled,
      onError: (err) => {
        console.log(err);
      },
    },
  );
};

export default useGetCommunityByIdQuery;
