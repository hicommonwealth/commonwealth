import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { trpc } from 'client/scripts/utils/trpcClient';
import useUserStore from '../../ui/user';
import { UserStoreProps } from '../../ui/user/user';

function refreshUser(
  community_id: string,
  address: string,
  user: UserStoreProps,
) {
  const addresses = [...user.addresses].filter(
    (a) => !(a.address === address && a.community?.id === community_id),
  );
  const accounts = [...user.accounts].filter(
    (a) => !(a.address === address && a.community.id === community_id),
  );
  const community_ids = addresses.map((a) => a.community.id);
  const communities = [...user.communities].filter((c) =>
    community_ids.includes(c.id),
  );
  user.setData({
    addresses,
    communities,
    accounts,
    ...(user.accounts.length === 1 && { activeAccount: null }),
  });
}

export const useDeleteAddressMutation = () => {
  const user = useUserStore();
  return trpc.community.deleteAddress.useMutation({
    onSuccess: ({ community_id, address }) => {
      refreshUser(community_id, address, user);
      notifySuccess('Address has been successfully removed.');
    },
    onError: (err) => {
      notifyError(err.message);
    },
  });
};

export const useDeleteAllAddressesMutation = () => {
  const user = useUserStore();
  return trpc.community.deleteAllAddresses.useMutation({
    onSuccess: ({ community_id, address, deleted }) => {
      if (deleted === 0) return;
      refreshUser(community_id, address, user);
      notifySuccess('All addresses has been successfully removed.');
    },
    onError: (err) => {
      notifyError(err.message);
    },
  });
};
