import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AddressInfo from 'models/AddressInfo';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useUserStore, { userStore } from '../../ui/user';

const PROFILE_STALE_TIME = 30 * 1_000; // 3 minutes

type UseFetchProfileByIdQueryCommonProps =
  | {
      profileId: string;
      shouldFetchSelfProfile?: never;
    }
  | {
      profileId?: never;
      shouldFetchSelfProfile: boolean;
    };

const fetchProfileById = async ({
  profileId,
}: UseFetchProfileByIdQueryCommonProps) => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_PROFILES_BY_ID}`,
    {
      params: {
        ...(profileId
          ? { profileId }
          : {
              jwt: userStore.getState().jwt,
            }),
      },
    },
  );

  response.data.result.addresses.map((a) => {
    try {
      return new AddressInfo({
        id: a.id,
        address: a.address,
        communityId: a.community_id,
        walletId: a.wallet_id,
        walletSsoSource: a.wallet_sso_source,
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
  profileId,
  shouldFetchSelfProfile,
  apiCallEnabled = true,
}: UseFetchProfileByIdQuery & UseFetchProfileByIdQueryCommonProps) => {
  const user = useUserStore();

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.FETCH_PROFILES_BY_ID, profileId],
    queryFn: () =>
      fetchProfileById({
        profileId,
        shouldFetchSelfProfile,
      } as UseFetchProfileByIdQueryCommonProps),
    // eslint-disable-next-line @tanstack/query/no-deprecated-options
    onSuccess: (response) => {
      // update user addresses when
      // - self profile is fetched
      // - or `profileId` is matches auth user's profile id
      const userProfileId = user.addresses?.[0]?.profile?.id;
      const doesProfileIdMatch =
        userProfileId && userProfileId === response?.profile?.id;
      if (
        response?.addresses &&
        response?.addresses?.length > 0 &&
        (shouldFetchSelfProfile || doesProfileIdMatch)
      ) {
        user.setData({
          addresses: response.addresses.map(
            (a) =>
              new AddressInfo({
                id: a?.id,
                walletId: a?.wallet_id,
                profileId: a?.profile_id,
                communityId: a?.community_id,
                address: a?.address,
                ghostAddress: a?.ghost_address,
                lastActive: a?.last_active,
                walletSsoSource: a?.wallet_sso_source,
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
