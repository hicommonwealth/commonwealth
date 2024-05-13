import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface UpdateProfileByAddressProps {
  address: string;
  chain: string;
  profileId?: number;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string;
  backgroundImage?: string;
  promotionalEmailsEnabled?: boolean;
}

const updateProfileByAddress = async ({
  address,
  chain,
  profileId,
  bio,
  name,
  email,
  backgroundImage,
  avatarUrl,
  socials,
  promotionalEmailsEnabled,
}: UpdateProfileByAddressProps) => {
  // TODO: ideally this should return a response
  const response = await axios.post(`${app.serverUrl()}/updateProfile/v2`, {
    profileId,
    bio,
    name,
    email,
    backgroundImage,
    avatarUrl,
    socials,
    ...(typeof promotionalEmailsEnabled === 'boolean' && {
      promotionalEmailsEnabled,
    }),
    jwt: app.user.jwt,
  });

  const responseProfile = response.data.result.profile;
  const updatedProfile = new MinimumProfile(address, chain);
  updatedProfile.initialize(
    responseProfile.name,
    address,
    responseProfile.avatarUrl,
    profileId,
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
  return useMutation({
    mutationFn: updateProfileByAddress,
    onSuccess: async (updatedProfile) => {
      addressesWithChainsToUpdate?.map(({ address, chain }) => {
        const key = [ApiEndpoints.FETCH_PROFILES, chain, address];
        const existingProfile = queryClient.getQueryData(key);

        // TEMP: since we don't get the updated data from API, we will cancel existing and refetch profile
        // data for the current specified adddress/chain key pair
        if (existingProfile) {
          queryClient.setQueryData(key, () => updatedProfile);
        }
      });

      return updatedProfile;
    },
  });
};

export default useUpdateProfileByAddressMutation;
