import app from 'state';
import { trpc } from '../../../utils/trpcClient';

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
  return trpc.topic.getTopics.useQuery(
    {
      community_id: communityId || app.activeChainId()!,
      include_contest_managers: includeContestData,
    },
    {
      enabled: apiEnabled ?? true,
    },
  );
};

export default useFetchTopicsQuery;
