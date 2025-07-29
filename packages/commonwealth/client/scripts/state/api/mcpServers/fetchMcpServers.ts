import { trpc } from 'utils/trpcClient';

const useFetchMcpServersQuery = () => {
  return trpc.mcpServers.getAllMcpServers.useQuery();
};

export default useFetchMcpServersQuery;
