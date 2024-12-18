import { trpc } from 'client/scripts/utils/trpcClient';

const TOPICS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchTopicsProps {
  communityId: string;
  apiEnabled?: boolean;
  includeContestData?: boolean;
  includeArchivedTopics?: boolean;
}

const useFetchTopicsQuery = ({
  communityId,
  apiEnabled = true,
  includeContestData,
  includeArchivedTopics,
}: FetchTopicsProps) => {
  return trpc.community.getTopics.useQuery(
    {
      community_id: communityId,
      with_contest_managers: includeContestData,
      with_archived_topics: includeArchivedTopics,
    },
    {
      staleTime: TOPICS_STALE_TIME,
      enabled: apiEnabled,
    },
  );
};

export default useFetchTopicsQuery;
