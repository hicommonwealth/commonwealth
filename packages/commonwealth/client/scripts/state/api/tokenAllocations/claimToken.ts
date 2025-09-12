import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import SignTokenClaim from 'client/scripts/helpers/ContractHelpers/signTokenClaim';
import { useState } from 'react';
import { trpc } from 'utils/trpcClient';

// TODO: Pass or config?
const baseRpc = '';
const baseChainId = '1';

const useClaimTokenMutation = () => {
  const utils = trpc.useUtils();
  const [transactionHash, setTransactionHash] = useState<string>(
    '0x0000000000000000000000000000000000000000',
  );

  const updateClaimTransactionHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation({
      onSuccess: () => {
        notifySuccess('Claim transaction hash updated successfully');
      },
      onError: (error) => {
        notifyError(error.message);
      },
    });

  const claimToken = trpc.tokenAllocation.claimToken.useMutation({
    onSuccess: async (data) => {
      // invalidate related queries
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
      utils.tokenAllocation.getAllocation
        .invalidate({ magna_allocation_id: data.magna_allocation_id })
        .catch(console.error);

      // ensure transaction is signed and transaction hash is updated
      if (!data.transaction_hash) {
        try {
          const stc = new SignTokenClaim(data.to, baseRpc);
          const tx_hash = await stc.sign(data.from, baseChainId, data.data);
          setTransactionHash(tx_hash);
          // persist transaction hash
          // TODO: how to recover if this step fails?
          await updateClaimTransactionHash.mutateAsync({
            transaction_hash: tx_hash as `0x${string}`,
          });
        } catch (error) {
          notifyError(error.message);
        }
      }
      notifySuccess('Token claimed successfully');
    },
    onError: (error) => {
      notifyError(error.message);
    },
  });

  return {
    mutate: claimToken.mutate,
    isPending: claimToken.isPending,
    transactionHash,
  };
};

export default useClaimTokenMutation;
