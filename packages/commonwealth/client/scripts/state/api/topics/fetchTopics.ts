import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { trpc } from '../../../utils/trpcClient';

const TOPICS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchTopicsProps {
  communityId: string;
  apiEnabled?: boolean;
  includeContestData?: boolean;
}

const useFetchTopicsQuery = ({
  communityId,
  apiEnabled = true,
  includeContestData,
}: FetchTopicsProps) => {
  return trpc.topic.getTopics.useQuery({
    queryKey: [ApiEndpoints.BULK_TOPICS, communityId, includeContestData],
    community_id: communityId || app.activeChainId()!,
    include_contest_managers: includeContestData,
    staleTime: TOPICS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchTopicsQuery;
