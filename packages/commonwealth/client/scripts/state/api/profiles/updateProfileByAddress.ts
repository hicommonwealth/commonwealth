import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface UpdateProfileByAddressProps {
  address: string;
  profileId?: number;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string;
  backgroundImage?: string;
}

const updateProfileByAddress = async ({
  profileId,
  bio,
  name,
  email,
  backgroundImage,
  avatarUrl,
  socials,
}: UpdateProfileByAddressProps) => {
  // TODO: ideally this should return a response
  await axios.post(`${app.serverUrl()}/updateProfile/v2`, {
    profileId,
    bio,
    name,
    email,
    backgroundImage,
    avatarUrl,
    socials,
    jwt: app.user.jwt,
  });

  // TEMP: return the updated fields which we would expect from API
  return {
    profileId,
    bio,
    name,
    email,
    backgroundImage,
    avatarUrl,
    socials,
  };
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
}: UseUpdateProfileByAddressMutation) => {
  return useMutation({
    mutationFn: updateProfileByAddress,
    onSuccess: async (updatedProfile) => {
      addressesWithChainsToUpdate?.map(({ address, chain }) => {
        const key = [ApiEndpoints.FETCH_PROFILES, chain, address];
        const existingProfile = queryClient.getQueryData(key);

        // TEMP: since we don't get the updated data from API, we will cancel existing and refetch profile
        // data for the current specified adddress/chain key pair
        if (existingProfile) {
          queryClient.cancelQueries(key);
          queryClient.refetchQueries(key);
        }
      });

      return updatedProfile;
    },
  });
};

export default useUpdateProfileByAddressMutation;
