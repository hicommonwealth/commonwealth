import { trpc } from 'utils/trpcClient';

const useSetCommunityMcpServersMutation = () => {
  return trpc.community.setCommunityMcpServers.useMutation();
};

export default useSetCommunityMcpServersMutation;
