import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';
import useUserStore, { userStore } from '../../ui/user';

interface UpdateProfileByAddressProps {
  userId: number;
  address: string;
  chain: string;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string;
  backgroundImage?: string;
  tagIds?: number[];
}

const updateProfileByAddress = async ({
  userId,
  address,
  chain,
  bio,
  name,
  email,
  backgroundImage,
  avatarUrl,
  socials,
  tagIds,
}: UpdateProfileByAddressProps) => {
  // TODO: ideally this should return a response
  const response = await axios.post(`${app.serverUrl()}/updateProfile/v2`, {
    userId,
    bio,
    name,
    email,
    backgroundImage,
    avatarUrl,
    socials,
    ...(tagIds && {
      tag_ids: tagIds,
    }),
    jwt: userStore.getState().jwt,
  });

  const responseProfile = response.data.result.profile;
  const updatedProfile = new MinimumProfile(address, chain);
  updatedProfile.initialize(
    userId,
    responseProfile.name || responseProfile.profile_name,
    address,
    responseProfile.avatarUrl,
    chain,
    responseProfile.lastActive,
  );
  return updatedProfile;
};

interface AddressesWithChainsToUpdate {
  address: string;
  chain: string;
}

interface UseUpdateProfileByAddressMutation {
  addressesWithChainsToUpdate?: AddressesWithChainsToUpdate[];
}

const useUpdateProfileByAddressMutation = ({
  addressesWithChainsToUpdate,
}: UseUpdateProfileByAddressMutation = {}) => {
  const user = useUserStore();

  return useMutation({
    mutationFn: updateProfileByAddress,
    onSuccess: async (updatedProfile) => {
      addressesWithChainsToUpdate?.map(({ address, chain }) => {
        const key = [ApiEndpoints.FETCH_PROFILES_BY_ADDRESS, chain, address];
        const existingProfile = queryClient.getQueryData(key);

        // TEMP: since we don't get the updated data from API, we will cancel existing and refetch profile
        // data for the current specified adddress/chain key pair
        if (existingProfile) {
          queryClient.setQueryData(key, () => updatedProfile);
        }
      });

      // if `userId` matches auth user's id, refetch profile-by-id query for auth user.
      if (user.id === updatedProfile.userId) {
        const keys = [
          [ApiEndpoints.FETCH_PROFILES_BY_ID, undefined],
          [ApiEndpoints.FETCH_PROFILES_BY_ID, user.id],
        ];
        keys.map((key) => {
          queryClient.cancelQueries(key).catch(console.error);
          queryClient.refetchQueries(key).catch(console.error);
        });

        // if `userId` matches auth user's id, and user profile has a defined name, then
        // set welcome onboard step as complete
        if (
          updatedProfile.name &&
          updatedProfile.name !== 'Anonymous' &&
          !user.isWelcomeOnboardFlowComplete
        ) {
          user.setData({ isWelcomeOnboardFlowComplete: true });
        }
      }

      return updatedProfile;
    },
  });
};

export default useUpdateProfileByAddressMutation;
