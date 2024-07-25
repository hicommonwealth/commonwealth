import { DEFAULT_NAME } from '@hicommonwealth/shared';
import MinimumProfile from '../../../models/MinimumProfile';
import { trpc } from '../../../utils/trpcClient';
import useUserStore from '../../ui/user';
import { ApiEndpoints, queryClient } from '../config';

interface AddressesWithChainsToUpdate {
  address: string;
  chain: string;
}

interface UseUpdateProfileByAddressMutation {
  addressesWithChainsToUpdate?: AddressesWithChainsToUpdate[];
}

const useUpdateUserMutation = ({
  addressesWithChainsToUpdate,
}: UseUpdateProfileByAddressMutation = {}) => {
  const user = useUserStore();

  return trpc.user.updateUser.useMutation({
    onSuccess: (updated) => {
      addressesWithChainsToUpdate?.map(({ address, chain }) => {
        const key = [ApiEndpoints.FETCH_PROFILES_BY_ADDRESS, chain, address];
        const existingProfile = queryClient.getQueryData(key);

        // TEMP: since we don't get the updated data from API, we will cancel existing and refetch profile
        // data for the current specified adddress/chain key pair
        if (existingProfile) {
          const updatedProfile = new MinimumProfile(address, chain);
          updatedProfile.initialize(
            updated.id!,
            updated.profile.name!,
            address,
            updated.profile.avatar_url!,
            chain,
            null,
          );
          queryClient.setQueryData(key, () => updatedProfile);
        }
      });

      // if `userId` matches auth user's id, refetch profile-by-id query for auth user.
      if (user.id === updated.id) {
        const keys = [
          [ApiEndpoints.FETCH_PROFILES_BY_ID, undefined],
          [ApiEndpoints.FETCH_PROFILES_BY_ID, user.id],
        ];
        keys.map((key) => {
          queryClient.cancelQueries(key).catch(console.error);
          queryClient.refetchQueries(key).catch(console.error);
        });

        // if user profile has a defined name, then set welcome onboard step as complete
        if (
          updated.profile.name &&
          updated.profile.name !== DEFAULT_NAME &&
          !user.isWelcomeOnboardFlowComplete
        ) {
          user.setData({ isWelcomeOnboardFlowComplete: true });
        }
      }

      return updated;
    },
  });
};

export default useUpdateUserMutation;
