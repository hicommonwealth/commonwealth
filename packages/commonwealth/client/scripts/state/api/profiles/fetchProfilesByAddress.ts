import { UserTierMap } from '@hicommonwealth/shared';
import MinimumProfile from 'models/MinimumProfile';
import { trpc, trpcQueryUtils } from 'utils/trpcClient';
const PROFILES_STALE_TIME = 60 * 3_000; // 3 mins

interface FetchProfilesByAddressProps {
  currentChainId: string;
  profileChainIds: string[];
  profileAddresses: string[];
  initiateProfilesAfterFetch?: boolean;
}

interface UseFetchProfilesByAddressesQuery extends FetchProfilesByAddressProps {
  apiCallEnabled?: boolean;
}

// use this for react components and hooks
const useFetchProfilesByAddressesQuery = ({
  currentChainId,
  profileChainIds,
  profileAddresses = [],
  apiCallEnabled = true,
}: UseFetchProfilesByAddressesQuery) => {
  return trpc.user.getUserAddresses.useQuery(
    {
      communities: profileChainIds.join(','),
      addresses: profileAddresses.join(','),
    },
    {
      select: (profiles) =>
        profiles.map((t) => {
          const profile = new MinimumProfile(t.address, currentChainId);
          profile.initialize(
            t.userId,
            t.name,
            t.address,
            t.avatarUrl ?? '',
            currentChainId,
            new Date(t.lastActive),
            t.tier ?? UserTierMap.IncompleteUser,
          );
          return profile;
        }),
      staleTime: PROFILES_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

// use this for non-react components
export const fetchProfilesByAddress = async (
  communities: string[],
  addresses: string[],
) => {
  const profilesData = await trpcQueryUtils.user.getUserAddresses.fetch({
    communities: communities.join(','),
    addresses: addresses.join(','),
  });

  if (!profilesData) {
    return [];
  }

  return profilesData.map((t) => {
    const profile = new MinimumProfile(t.address, communities[0]);
    profile.initialize(
      t.userId,
      t.name,
      t.address,
      t.avatarUrl ?? '',
      communities[0],
      new Date(t.lastActive),
      t.tier ?? UserTierMap.IncompleteUser,
    );
    return profile;
  });
};

export default useFetchProfilesByAddressesQuery;
