import { ChainBase } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const ACTIVE_COMMUNITIES_STALE_TIME = 60 * 1_000; // 1 min

interface FetchActiveCommunitiesResponse {
  communities: {
    id: string;
    name: string;
    chainBase: ChainBase;
    ethChainId?: string;
    cosmosChainId?: string;
    description: string;
    iconUrl: string;
    socialLinks: string[];
    nodeUrl: string;
    altWalletUrl: string;
    userAddress: string;
    bech32Prefix?: string;
  }[];
  totalCommunitiesCount: number;
}

const fetchActiveCommunities = async () => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_ACTIVE_COMMUNITIES}?active=true`,
  );
  return response.data.result;
};

const useFetchActiveCommunitiesQuery = () => {
  return useQuery<FetchActiveCommunitiesResponse>({
    queryKey: [ApiEndpoints.FETCH_ACTIVE_COMMUNITIES],
    queryFn: () => fetchActiveCommunities(),
    staleTime: ACTIVE_COMMUNITIES_STALE_TIME,
  });
};

export default useFetchActiveCommunitiesQuery;
