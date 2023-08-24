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

const useFetchProfilesByAddressQuery = ({
  currentChainId,
  profileChainIds,
  profileAddresses,
}: FetchProfilesByAddressProps) => {
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
  });
};

export default useFetchProfilesByAddressQuery;
