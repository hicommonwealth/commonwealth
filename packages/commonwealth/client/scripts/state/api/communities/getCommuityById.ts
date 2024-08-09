import { Community, ExtendedCommunity } from '@hicommonwealth/schemas';
import axios from 'axios';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';
import app from '../../index';
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

export const EXCEPTION_CASE_VANILLA_getCommunityById = async (
  communityId: string,
  includeNodeInfo = false,
): Promise<z.infer<typeof Community>> => {
  // HACK: 8762 -- find a way to call getCommunityById trpc in non-react files
  // when u do, update `EXCEPTION_CASE_VANILLA_getCommunityById` name and make the
  // call from that function
  const response = await axios.get(
    // eslint-disable-next-line max-len
    `${app.serverUrl()}/v1/community.getCommunity?batch=1&input=%7B%220%22%3A%7B%22id%22%3A%22${communityId}%22%2C%22include_node_info%22%3A${includeNodeInfo}%7D%7D`,
  );
  return response?.data[0]?.result.data;
};

const useGetCommunityByIdQuery = ({
  id,
  includeNodeInfo = false,
  enabled,
}: UseGetCommunityByIdProps) => {
  return trpc.community.getCommunity.useQuery<
    z.infer<typeof ExtendedCommunity>
  >(
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
