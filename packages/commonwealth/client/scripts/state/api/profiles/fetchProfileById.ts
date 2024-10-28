import { trpc } from 'client/scripts/utils/trpcClient';
import AddressInfo from 'models/AddressInfo';
import moment from 'moment';
import useUserStore from '../../ui/user';

const PROFILE_STALE_TIME = 30 * 1_000; // 3 minutes

type UseFetchProfileByIdQueryCommonProps =
  | {
      userId: number;
      shouldFetchSelfProfile?: never;
    }
  | {
      userId?: never;
      shouldFetchSelfProfile: boolean;
    };

interface UseFetchProfileByIdQuery {
  apiCallEnabled?: boolean;
}
const useFetchProfileByIdQuery = ({
  userId,
  apiCallEnabled = true,
}: UseFetchProfileByIdQuery & UseFetchProfileByIdQueryCommonProps) => {
  const user = useUserStore();

  return trpc.user.getUserProfile.useQuery(
    {
      userId,
    },
    {
      select: (profile) => {
        if (profile.userId === user.id && profile.addresses.length > 0) {
          user.setData({
            addresses: profile.addresses.map(
              (a) =>
                new AddressInfo({
                  userId: user.id,
                  id: a.id!,
                  address: a?.address,
                  walletId: a.wallet_id!,
                  ghostAddress: a?.ghost_address,
                  community: {
                    id: a.community_id!,
                    base: a.Community.base,
                    ss58Prefix: a.Community.ss58_prefix || undefined,
                  },
                  lastActive: a.last_active ? moment(a.last_active) : undefined,
                }),
            ),
          });
        }
        return profile;
      },
      staleTime: PROFILE_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useFetchProfileByIdQuery;
