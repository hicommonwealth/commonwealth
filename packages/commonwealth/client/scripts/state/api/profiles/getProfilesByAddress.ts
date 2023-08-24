import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import MinimumProfile from 'models/MinimumProfile';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const PROFILES_STALE_TIME = 30 * 1_000; // 3 minutes

interface FetchProfilesByAddressProps {
  currentChainId: string;
  profileChainIds: string[];
  profileAddresses: string[];
}

// "profileId": 98000,
// "name": "Marcc",
// "address": "0x067a7910789f214A13E195a025F881E9B59C4D76",
// "lastActive": "2023-06-20T15:29:49.887Z",
// "avatarUrl": null
const fetchProfilesByAddress = async ({
  currentChainId,
  profileAddresses,
  profileChainIds,
}: FetchProfilesByAddressProps) => {
  const response = await axios.post(
    `${app.serverUrl()}${ApiEndpoints.FETCH_PROFILES}`,
    {
      addresses: profileAddresses,
      chains: profileChainIds,
      jwt: app.user.jwt,
    }
  );

  return response.data.result.map((t) => {
    const profile = new MinimumProfile(t.address, currentChainId);
    profile.initialize(
      t.name,
      t.address,
      t.avatarUrl,
      t.profileId,
      currentChainId,
      t.lastActive
    );
    return profile;
  });
};

interface UseFetchProfilesByAddressQuery extends FetchProfilesByAddressProps {
  apiEnabled?: boolean;
}
const useFetchProfilesByAddressQuery = ({
  currentChainId,
  profileChainIds,
  profileAddresses,
  apiEnabled = true,
}: UseFetchProfilesByAddressQuery) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.FETCH_PROFILES,
      currentChainId,
      ...profileChainIds,
      ...profileAddresses,
    ],
    queryFn: () =>
      fetchProfilesByAddress({
        currentChainId,
        profileAddresses,
        profileChainIds,
      }),
    staleTime: PROFILES_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchProfilesByAddressQuery;
