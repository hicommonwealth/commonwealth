import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { trpc } from 'utils/trpcClient';

const useUpdateClaimTransactionHashMutation = () => {
  return trpc.tokenAllocation.updateClaimTransactionHash.useMutation({
    onSuccess: () => {
      notifySuccess('Claim transaction hash updated successfully');
    },
    onError: (error) => {
      notifyError(error.message);
    },
  });
};

export default useUpdateClaimTransactionHashMutation;
