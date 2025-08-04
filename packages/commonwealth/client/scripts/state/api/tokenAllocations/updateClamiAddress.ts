import { trpc } from 'utils/trpcClient';

const useUpdateClaimAddressMutation = () => {
  const utils = trpc.useUtils();

  return trpc.tokenAllocation.updateClaimAddress.useMutation({
    onSuccess: () => {
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
    },
  });
};

export default useUpdateClaimAddressMutation;
