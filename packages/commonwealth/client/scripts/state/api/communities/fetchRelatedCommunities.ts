import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const RELATED_COMMUNITIES_STALE_TIME = 60 * 5 * 1_000; // 5 min

interface FetchRelatedCommunitiesProps {
  chainNodeId?: number;
}

interface FetchRelatedCommunitiesResponse {
  profile_count: string;
  community: string;
  description: string;
  icon_url: string;
  id: string;
  lifetime_thread_count: string;
  namespace: string;
  chain_node_id: number;
}

const fetchRelatedCommunities = async ({
  chainNodeId,
}: FetchRelatedCommunitiesProps) => {
  const response = await axios.get(
    `${SERVER_URL}${ApiEndpoints.FETCH_RELATED_COMMUNITIES}`,
    {
      params: {
        chainNodeId,
      },
    },
  );

  return response.data.result;
};

const useFetchRelatedCommunitiesQuery = ({
  chainNodeId,
}: FetchRelatedCommunitiesProps) => {
  return useQuery<FetchRelatedCommunitiesResponse[]>({
    queryKey: [ApiEndpoints.FETCH_RELATED_COMMUNITIES, chainNodeId],
    queryFn: () => fetchRelatedCommunities({ chainNodeId }),
    staleTime: RELATED_COMMUNITIES_STALE_TIME,
    enabled: !!chainNodeId,
  });
};

export default useFetchRelatedCommunitiesQuery;
