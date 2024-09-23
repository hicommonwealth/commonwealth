import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { trpc } from '../../../utils/trpcClient';

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
  const response = await trpc.topic.getTopics.useQuery({
    community_id: communityId || app.activeChainId(),
    include_contest_managers: includeContestData,
  });

  return response.data.result.map((t) => new Topic(t));
};

const useFetchTopicsQuery = ({
  communityId,
  apiEnabled = true,
  includeContestData,
}: FetchTopicsProps) => {
  return trpc.topic.getTopics.useQuery({
    queryKey: [ApiEndpoints.BULK_TOPICS, communityId, includeContestData],
    community_id: communityId || app.activeChainId(),
    include_contest_managers: includeContestData,
    staleTime: TOPICS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchTopicsQuery;
