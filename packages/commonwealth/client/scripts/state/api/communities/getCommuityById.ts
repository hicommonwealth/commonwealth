import { ExtendedCommunity } from '@hicommonwealth/schemas';
import axios from 'axios';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';
import { queryClient, SERVER_URL } from '../config';

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

export const EXCEPTION_CASE_VANILLA_getCommunityById = async (
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

  // HACK: 8762 -- find a way to call getCommunityById trpc in non-react files
  // and update `EXCEPTION_CASE_VANILLA_getCommunityById` name
  const response = await axios.get(
    // eslint-disable-next-line max-len
    `${SERVER_URL}/v1/community.getCommunity?batch=1&input=%7B%220%22%3A%7B%22id%22%3A%22${communityId}%22%2C%22include_node_info%22%3A${includeNodeInfo}%7D%7D`,
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
    },
  );
};

export default useGetCommunityByIdQuery;
