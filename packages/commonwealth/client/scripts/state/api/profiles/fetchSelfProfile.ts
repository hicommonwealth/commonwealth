import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AddressInfo from 'client/scripts/models/AddressInfo';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const PROFILES_STALE_TIME = 30 * 1_000; // 3 minutes

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
}
const useFetchSelfProfileQuery = ({
  apiCallEnabled = true,
}: UseFetchSelfProfileQuery) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.FETCH_PROFILES],
    queryFn: fetchSelfProfile,
    staleTime: PROFILES_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

export default useFetchSelfProfileQuery;
