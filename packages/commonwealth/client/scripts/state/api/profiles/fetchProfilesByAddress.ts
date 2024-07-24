import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';
import { userStore } from '../../ui/user';

const PROFILES_STALE_TIME = 30 * 1_000; // 3 minutes

interface FetchProfilesByAddressProps {
  currentChainId: string;
  profileChainIds: string[];
  profileAddresses: string[];
  initiateProfilesAfterFetch?: boolean;
}

export const fetchProfilesByAddress = async ({
  currentChainId,
  profileAddresses,
  profileChainIds,
  initiateProfilesAfterFetch = true,
}: FetchProfilesByAddressProps) => {
  const response = await axios.post(
    `${app.serverUrl()}${ApiEndpoints.FETCH_PROFILES_BY_ADDRESS}`,
    {
      addresses: profileAddresses,
      communities: profileChainIds,
      ...(userStore.getState().jwt && { jwt: userStore.getState().jwt }),
    },
  );

  if (!initiateProfilesAfterFetch) return response.data.result;

  return response.data.result.map((t) => {
    const profile = new MinimumProfile(t.address, currentChainId);
    profile.initialize(
      t.userId,
      t.name,
      t.address,
      t.avatarUrl,
      currentChainId,
      t.lastActive,
    );
    return profile;
  });
};

interface UseFetchProfilesByAddressesQuery extends FetchProfilesByAddressProps {
  apiCallEnabled?: boolean;
}
const useFetchProfilesByAddressesQuery = ({
  currentChainId,
  profileChainIds,
  profileAddresses = [],
  apiCallEnabled = true,
  initiateProfilesAfterFetch = true,
}: UseFetchProfilesByAddressesQuery) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ApiEndpoints.FETCH_PROFILES_BY_ADDRESS,
      // we should not cache by currentChainId as it can break logic for DISCOURAGED_NONREACTIVE_fetchProfilesByAddress
      // currentChainId,
      // sort the chain/address ids by ascending so the keys are always in the same order
      ...[...profileChainIds].sort((a, b) => a.localeCompare(b)),
      ...[...profileAddresses].sort((a, b) => a.localeCompare(b)),
    ],
    queryFn: () =>
      fetchProfilesByAddress({
        currentChainId,
        profileAddresses,
        profileChainIds,
        initiateProfilesAfterFetch,
      }),
    staleTime: PROFILES_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

// Some of the core logic in the app is non-reactive like the Account.ts file. These non-reactive
// touch points call the api directly. After the RQ migration we needed to move them to react but
// moving the core logic all at once isn't a very good option. As a gradual migration process to use
// proper state and react'ive code, we created this method. It provides a link to get the benefits of
// react query like cache/stale timer and more in non-react files. As the name suggests its discouraged
// to use and should be avoided at all costs. If this is used anywhere, then it should follow the underlying
// reason of its creation.
// TODO: After account controller is de-side-effected (all api calls removed). Then we would be in a better
// position to remove this discouraged method
export const DISCOURAGED_NONREACTIVE_fetchProfilesByAddress = (
  chainId: string,
  address: string,
) => {
  return queryClient.fetchQuery(
    [ApiEndpoints.FETCH_PROFILES_BY_ADDRESS, chainId, address],
    {
      queryFn: () =>
        fetchProfilesByAddress({
          currentChainId: chainId,
          profileChainIds: [chainId],
          profileAddresses: [address],
        }),
    },
  );
};

export default useFetchProfilesByAddressesQuery;
