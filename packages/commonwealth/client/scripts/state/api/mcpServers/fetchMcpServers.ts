import { trpc } from 'utils/trpcClient';

const useFetchMcpServersQuery = (communityId: string) => {
  return trpc.mcp.getCommunityMcpServers.useQuery(
    { community_id: communityId, private_only: true },
    { enabled: !!communityId },
  );
};

export default useFetchMcpServersQuery;
