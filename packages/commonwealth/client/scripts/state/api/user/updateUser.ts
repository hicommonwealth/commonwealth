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
      const keys = [
        [ApiEndpoints.FETCH_PROFILES_BY_ID, undefined],
        [ApiEndpoints.FETCH_PROFILES_BY_ID, user.id],
      ];
      keys.map((key) => {
        queryClient.cancelQueries(key).catch(console.error);
        queryClient.refetchQueries(key).catch(console.error);
      });

      updated.is_welcome_onboard_flow_complete &&
        user.setData({
          isWelcomeOnboardFlowComplete: true,
        });

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

      return updated;
    },
  });
};

export default useUpdateUserMutation;
