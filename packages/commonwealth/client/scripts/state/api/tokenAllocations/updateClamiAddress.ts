import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { trpc } from 'utils/trpcClient';

const useUpdateClaimAddressMutation = () => {
  const utils = trpc.useUtils();

  return trpc.tokenAllocation.updateClaimAddress.useMutation({
    onSuccess: () => {
      notifySuccess('Claim address updated successfully');
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
    },
    onError: (error) => {
      notifyError(error.message);
    },
  });
};

export default useUpdateClaimAddressMutation;
