import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AddressInfo from 'client/scripts/models/AddressInfo';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const PROFILE_STALE_TIME = 30 * 1_000; // 3 minutes

const fetchSelfProfile = async () => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_SELF_PROFILE}`,
    {
      params: {
        jwt: app.user.jwt,
      },
    },
  );

  response.data.result.addresses.map((a) => {
    try {
      return new AddressInfo({
        id: a.id,
        address: a.address,
        communityId: a.community_id,
        keytype: a.keytype,
        walletId: a.wallet_id,
        walletSsoSource: a.wallet_sso_source,
        ghostAddress: a.ghost_address,
      });
    } catch (err) {
      console.error(`Could not return AddressInfo: "${err}"`);
      return null;
    }
  });

  return response.data.result;
};

interface UseFetchSelfProfileQuery {
  apiCallEnabled?: boolean;
  updateAddressesOnSuccess?: boolean;
}
const useFetchSelfProfileQuery = ({
  apiCallEnabled = true,
  updateAddressesOnSuccess = false,
}: UseFetchSelfProfileQuery) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROFILES],
    queryFn: fetchSelfProfile,
    onSuccess: (profile) => {
      if (
        updateAddressesOnSuccess &&
        profile?.addresses &&
        profile?.addresses?.length > 0
      ) {
        app.user.setAddresses(
          profile.addresses.map(
            (a) =>
              new AddressInfo({
                id: a?.id,
                walletId: a?.wallet_id,
                profileId: a?.profile_id,
                communityId: a?.community_id,
                keytype: a?.keytype,
                address: a?.address,
                ghostAddress: a?.ghost_address,
                lastActive: a?.last_active,
                walletSsoSource: a?.wallet_sso_source,
              }),
          ),
        );
      }
    },
    staleTime: PROFILE_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

export default useFetchSelfProfileQuery;
