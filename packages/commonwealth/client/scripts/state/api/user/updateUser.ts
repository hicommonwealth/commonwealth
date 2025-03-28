import { DEFAULT_NAME } from '@hicommonwealth/shared';
import Account from '../../../models/Account';
import MinimumProfile from '../../../models/MinimumProfile';
import app from '../../../state';
import { trpc } from '../../../utils/trpcClient';
import useUserStore from '../../ui/user';

interface AddressesWithChainsToUpdate {
  address: string;
  chain: string;
}

interface UseUpdateProfileByAddressMutation {
  addressesWithChainsToUpdate?: AddressesWithChainsToUpdate[];
  onSuccess?: (updated: any) => void;
}

const useUpdateUserMutation = ({
  addressesWithChainsToUpdate,
  onSuccess,
}: UseUpdateProfileByAddressMutation = {}) => {
  const user = useUserStore();
  const utils = trpc.useUtils();

  return trpc.user.updateUser.useMutation({
    onSuccess: async (updated) => {
      console.log('UU1: updateUser mutation successful', updated);
      await utils.user.getUserProfile.refetch({}); // we access this in some page which fetches auth user profile
      console.log('UU2: getUserProfile refetched globally');
      await utils.user.getUserProfile.refetch({ userId: user.id });
      console.log('UU3: getUserProfile refetched for specific user');

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

      if (typeof updated.email !== 'undefined' && !updated.email) {
        app.user.jwt = '';
        app.user.setData({
          email: '',
        });
        localStorage.removeItem('jwt');
        return updated;
      }

      if (typeof updated.profile?.name !== 'undefined') {
        app.user.setData({
          email: updated.email || app.user.email,
          name: updated.profile.name || app.user.name,
        });
      }

      if (typeof updated.disableRichText !== 'undefined') {
        app.user.setData({
          disableRichText: updated.disableRichText,
        });
      }

      if (typeof updated.enableMentionEmails !== 'undefined') {
        app.user.setData({
          enableMentionEmails: updated.enableMentionEmails,
        });
      }

      if (typeof updated.activeAccount !== 'undefined') {
        const accounts = app.user.activeAccounts;
        app.user.setData({
          activeAccounts: {
            ...accounts,
            [updated.activeAccount.community.id]: new Account(
              updated.activeAccount,
            ),
          },
        });
      }
      console.log('UU4: Updated app.user data');
      return updated;
    },
    onError: (error) => {
      console.log('UU-ERROR: updateUser mutation failed', error);
    },
  });
};

export default useUpdateUserMutation;
