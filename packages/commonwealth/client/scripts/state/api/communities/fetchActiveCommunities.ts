import { ChainBase } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Tag from 'models/Tag';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const ACTIVE_COMMUNITIES_STALE_TIME = 60 * 1_000; // 1 min

export interface FetchActiveCommunitiesResponse {
  communities: {
    id: string;
    name: string;
    chainBase: ChainBase;
    ethChainId?: string;
    cosmosChainId?: string;
    description: string;
    icon_url: string;
    socialLinks: string[];
    nodeUrl: string;
    altWalletUrl: string;
    userAddress: string;
    bech32Prefix?: string;
    CommunityTags: Tag[];
    recentThreadsCount: string;
  }[];
  totalCommunitiesCount: number;
}

const fetchActiveCommunities = async () => {
  const response = await axios.get(
    `${SERVER_URL}${ApiEndpoints.FETCH_ACTIVE_COMMUNITIES}?active=true`,
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
