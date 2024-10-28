import { trpc } from 'client/scripts/utils/trpcClient';
import MinimumProfile from 'models/MinimumProfile';

const PROFILES_STALE_TIME = 30 * 1_000; // 3 minutes

interface FetchProfilesByAddressProps {
  currentChainId: string;
  profileChainIds: string[];
  profileAddresses: string[];
  initiateProfilesAfterFetch?: boolean;
}

interface UseFetchProfilesByAddressesQuery extends FetchProfilesByAddressProps {
  apiCallEnabled?: boolean;
}
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
          );
          return profile;
        }),
      staleTime: PROFILES_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useFetchProfilesByAddressesQuery;
