import { GetNewProfileResp, UserProfile } from '@hicommonwealth/schemas';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AddressInfo from 'models/AddressInfo';
import moment from 'moment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { z } from 'zod';
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

export type MappedProfile = z.infer<typeof UserProfile> & {
  id: number;
  profile_name: string;
  is_owner: boolean;
};
type MappedResponse = z.infer<typeof GetNewProfileResp> & {
  profile: MappedProfile;
};

const fetchProfileById = async ({
  profileId,
}: UseFetchProfileByIdQueryCommonProps): Promise<MappedResponse> => {
  const response = await axios.get<{
    result: z.infer<typeof GetNewProfileResp>;
  }>(`${app.serverUrl()}${ApiEndpoints.FETCH_PROFILES_BY_ID}`, {
    params: {
      ...(profileId
        ? { profileId }
        : {
            jwt: userStore.getState().jwt,
          }),
    },
  });

  response.data.result.addresses.map((a) => {
    try {
      return new AddressInfo({
        id: a.id,
        address: a.address,
        communityId: a.community_id!,
        keytype: a.keytype,
        walletId: a.wallet_id,
        walletSsoSource: a.wallet_sso_source,
        ghostAddress: a.ghost_address,
      });
    } catch (err) {
      console.error(`Could not return AddressInfo: "${err}"`);
      return null;
    }
  });

  // TO BE REMOVED
  const profile: MappedResponse = {
    ...response.data.result,
    ...{
      profile: {
        // this is a temporary mapping until we finish the migration to the new model/schemas
        id: response.data.result.addresses.at(0)!.profile_id!,
        profile_name: response.data.result.profile.name!,
        is_owner: false,
        ...response.data.result.profile,
      },
    },
  };
  return profile;
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
      response.profile.is_owner = userProfileId === response?.profile?.id;
      if (
        response?.addresses &&
        response?.addresses?.length > 0 &&
        (shouldFetchSelfProfile || response.profile.is_owner)
      ) {
        user.setData({
          addresses: response.addresses.map(
            (a) =>
              new AddressInfo({
                id: a?.id,
                walletId: a?.wallet_id,
                profileId: a.profile_id!,
                communityId: a.community_id!,
                keytype: a?.keytype,
                address: a?.address,
                ghostAddress: a?.ghost_address,
                lastActive: a.last_active ? moment(a.last_active) : undefined,
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
