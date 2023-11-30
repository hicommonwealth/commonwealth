import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const TOPICS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchTopicsProps {
  chainId: string;
}

const fetchTopics = async ({ chainId }: FetchTopicsProps) => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.BULK_TOPICS}`,
    {
      params: {
        community_id: chainId || app.activeChainId(),
      },
    },
  );

  return response.data.result.map((t) => new Topic(t));
};

const useFetchTopicsQuery = ({ chainId }: FetchTopicsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.BULK_TOPICS, chainId],
    queryFn: () => fetchTopics({ chainId }),
    staleTime: TOPICS_STALE_TIME,
  });
};

export default useFetchTopicsQuery;
