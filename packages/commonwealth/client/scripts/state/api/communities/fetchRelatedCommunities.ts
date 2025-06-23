import { trpc } from 'utils/trpcClient';

const RELATED_COMMUNITIES_STALE_TIME = 60 * 5 * 1_000; // 5 min

const useFetchRelatedCommunitiesQuery = ({
  chainNodeId,
}: {
  chainNodeId: number;
}) => {
  return trpc.community.getRelatedCommunities.useQuery(
    {
      chain_node_id: chainNodeId,
    },
    {
      staleTime: RELATED_COMMUNITIES_STALE_TIME,
      enabled: !!chainNodeId,
    },
  );
};

export default useFetchRelatedCommunitiesQuery;
