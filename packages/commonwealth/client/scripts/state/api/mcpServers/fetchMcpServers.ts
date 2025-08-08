import { trpc } from 'utils/trpcClient';

const useFetchMcpServersQuery = (communityId: string) => {
  return trpc.mcpServers.getAllMcpServers.useQuery(
    { community_id: communityId },
    { enabled: !!communityId },
  );
};

export default useFetchMcpServersQuery;
