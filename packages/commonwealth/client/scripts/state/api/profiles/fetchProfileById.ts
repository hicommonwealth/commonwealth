import { GetNewProfileResp } from '@hicommonwealth/schemas';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AddressInfo from 'models/AddressInfo';
import moment from 'moment';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { z } from 'zod';
import useUserStore, { userStore } from '../../ui/user';

const PROFILE_STALE_TIME = 30 * 1_000; // 3 minutes

type UseFetchProfileByIdQueryCommonProps =
  | {
      userId: number;
      shouldFetchSelfProfile?: never;
    }
  | {
      userId?: never;
      shouldFetchSelfProfile: boolean;
    };

const fetchProfileById = async ({
  userId,
}: UseFetchProfileByIdQueryCommonProps): Promise<
  z.infer<typeof GetNewProfileResp>
> => {
  const response = await axios.get<{
    result: z.infer<typeof GetNewProfileResp>;
  }>(`${SERVER_URL}${ApiEndpoints.FETCH_PROFILES_BY_ID}`, {
    params: {
      ...(userId
        ? { userId }
        : {
            jwt: userStore.getState().jwt,
          }),
    },
  });

  response.data.result.addresses.map((a) => {
    try {
      return new AddressInfo({
        userId: userStore.getState().id,
        id: a.id!,
        address: a.address,
        community: {
          id: a.community_id!,
          base: a.Community.base,
          ss58Prefix: a.Community.ss58_prefix || undefined,
        },
        walletId: a.wallet_id!,
        ghostAddress: a.ghost_address,
      });
    } catch (err) {
      console.error(`Could not return AddressInfo: "${err}"`);
      return null;
    }
  });

  return response.data.result;
};

interface UseFetchProfileByIdQuery {
  apiCallEnabled?: boolean;
}
const useFetchProfileByIdQuery = ({
  userId,
  shouldFetchSelfProfile,
  apiCallEnabled = true,
}: UseFetchProfileByIdQuery & UseFetchProfileByIdQueryCommonProps) => {
  const user = useUserStore();

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.FETCH_PROFILES_BY_ID, userId],
    queryFn: () =>
      fetchProfileById({
        userId,
        shouldFetchSelfProfile,
      } as UseFetchProfileByIdQueryCommonProps),
    // eslint-disable-next-line @tanstack/query/no-deprecated-options
    onSuccess: (response) => {
      // update user addresses when self profile is fetched
      if (
        response?.addresses &&
        response?.addresses?.length > 0 &&
        (shouldFetchSelfProfile || userId === user.id)
      ) {
        user.setData({
          addresses: response.addresses.map(
            (a) =>
              new AddressInfo({
                userId: user.id,
                id: a.id!,
                walletId: a.wallet_id!,
                community: {
                  id: a.community_id!,
                  base: a.Community.base,
                  ss58Prefix: a.Community.ss58_prefix || undefined,
                },
                address: a?.address,
                ghostAddress: a?.ghost_address,
                lastActive: a.last_active ? moment(a.last_active) : undefined,
              }),
          ),
        });
      }
    },
    staleTime: PROFILE_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

export default useFetchProfileByIdQuery;
