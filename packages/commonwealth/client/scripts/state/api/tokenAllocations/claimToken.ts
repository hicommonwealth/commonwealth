import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { trpc } from 'utils/trpcClient';

const useClaimTokenMutation = () => {
  const utils = trpc.useUtils();

  return trpc.tokenAllocation.claimToken.useMutation({
    onSuccess: (data) => {
      notifySuccess('Token claimed successfully');
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
      utils.tokenAllocation.getAllocation
        .invalidate({ magna_allocation_id: data.magna_allocation_id })
        .catch(console.error);
    },
    onError: (error) => {
      notifyError(error.message);
    },
  });
};

export default useClaimTokenMutation;
