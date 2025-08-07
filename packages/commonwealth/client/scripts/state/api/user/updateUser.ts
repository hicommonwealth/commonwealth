import { DEFAULT_NAME, UserTierMap } from '@hicommonwealth/shared';
import MinimumProfile from '../../../models/MinimumProfile';
import { trpc } from '../../../utils/trpcClient';
import useUserStore from '../../ui/user';

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
  const utils = trpc.useUtils();

  return trpc.user.updateUser.useMutation({
    onSuccess: async (updated) => {
      await utils.user.getUserProfile.refetch({}); // we access this in some page which fetches auth user profile
      await utils.user.getUserProfile.refetch({ userId: user.id });
      await utils.user.getUserAddresses.invalidate();

      updated.is_welcome_onboard_flow_complete &&
        user.setData({
          isWelcomeOnboardFlowComplete: true,
        });

      addressesWithChainsToUpdate?.map(({ address, chain }) => {
        const cachedAddress = utils.user.getUserAddresses
          .getData({
            communities: chain,
            addresses: address,
          })
          ?.at(0);

        // TEMP: since we don't get the updated data from API, we will cancel existing and refetch profile
        // data for the current specified adddress/chain key pair
        if (cachedAddress) {
          const updatedProfile = new MinimumProfile(address, chain);
          updatedProfile.initialize(
            updated.id!,
            updated.profile.name!,
            address,
            updated.profile.avatar_url!,
            chain,
            null,
            UserTierMap.IncompleteUser,
          );
          utils.user.getUserAddresses.setData(
            {
              communities: chain,
              addresses: address,
            },
            [
              {
                ...cachedAddress,
                name: updated.profile.name ?? DEFAULT_NAME,
                avatarUrl: updated.profile.avatar_url,
              },
            ],
          );
        }
      });
      return updated;
    },
  });
};

export default useUpdateUserMutation;
