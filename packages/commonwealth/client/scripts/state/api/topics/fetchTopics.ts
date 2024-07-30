import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const TOPICS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchTopicsProps {
  communityId: string;
  apiEnabled?: boolean;
  includeContestData?: boolean;
}

const fetchTopics = async ({
  communityId,
  includeContestData = false,
}: FetchTopicsProps): Promise<Topic[]> => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.BULK_TOPICS}`,
    {
      params: {
        community_id: communityId || app.activeChainId(),
        with_contest_managers: includeContestData,
      },
    },
  );

  return response.data.result.map((t) => new Topic(t));
};

const useFetchTopicsQuery = ({
  communityId,
  apiEnabled = true,
  includeContestData,
}: FetchTopicsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.BULK_TOPICS, communityId, includeContestData],
    queryFn: () => fetchTopics({ communityId, includeContestData }),
    staleTime: TOPICS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchTopicsQuery;
