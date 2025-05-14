import { trpc } from 'utils/trpcClient';

const useCreateChainNodeMutation = () => {
  const utils = trpc.useUtils();
  return trpc.superAdmin.createChainNode.useMutation({
    onSuccess: () => {
      utils.superAdmin.getChainNodes.invalidate();
    },
  });
};

export default useCreateChainNodeMutation;
