import * as schemas from '@hicommonwealth/schemas';
import { getQueryKey } from '@trpc/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import { queryClient } from 'state/api/config';
import { BASE_API_PATH, trpc } from 'utils/trpcClient';
import { z } from 'zod';
import { userStore } from '../../ui/user';

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

// Some of the core logic in the app is non-reactive like the Account.ts file. These non-reactive
// touch points call the api directly. After the RQ migration we needed to move them to react but
// moving the core logic all at once isn't a very good option. As a gradual migration process to use
// proper state and react'ive code, we created this method. It provides a link to get the benefits of
// react query like cache/stale timer and more in non-react files. As the name suggests its discouraged
// to use and should be avoided at all costs. If this is used anywhere, then it should follow the underlying
// reason of its creation.
// TODO: After account controller is de-side-effected (all api calls removed). Then we would be in a better
// position to remove this discouraged method
export const DISCOURAGED_NONREACTIVE_fetchProfilesByAddress = async (
  communities: string[],
  addresses: string[],
) => {
  const queryKey = getQueryKey(trpc.user.getUserAddresses, {
    communities: communities.join(','),
    addresses: addresses.join(','),
  });

  // if profile already exists in cache, return that
  const cachedProfile = queryClient.getQueryData<
    z.infer<typeof schemas.GetUserAddresses.output> | undefined
  >(queryKey);

  if (cachedProfile) {
    return cachedProfile;
  }

  // HACK: with @trpc/react-query v10.x, we can't directly call an endpoint outside of 'react-context'
  // with this way the api can be used in non-react files. This should be cleaned up when we migrate
  // to @trpc/react-query v11.x

  // eslint-disable-next-line max-len
  const getUserAddressesTrpcUrl = `user.getUserAddresses?batch=1&input=${encodeURIComponent(`{"0":{"communities":"${communities.join(',')}","addresses":"${addresses.join(',')}"}}`)}`;

  const user = userStore.getState();

  if (
    !user.addressSelectorSelectedAddress &&
    !user.activeAccount &&
    user.addresses.length === 0
  ) {
    return;
  }

  const response = await axios.get(
    `${BASE_API_PATH}/${getUserAddressesTrpcUrl}`,
    {
      headers: {
        authorization: user.jwt || '',
        address:
          user.addressSelectorSelectedAddress ??
          user.activeAccount?.address ??
          user.addresses?.at(0)?.address,
      },
    },
  );

  const mappedProfiles = (response?.data?.[0]?.result?.data || []).map((t) => {
    const profile = new MinimumProfile(t.address, communities[0]);
    profile.initialize(
      t.userId,
      t.name,
      t.address,
      t.avatarUrl,
      communities[0],
      t.lastActive,
    );
    return profile;
  });

  queryClient.setQueryData(queryKey, mappedProfiles);

  return mappedProfiles;
};

export default useFetchProfilesByAddressesQuery;
