import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import SignTokenClaim from 'client/scripts/helpers/ContractHelpers/signTokenClaim';
import { BASE_ID } from 'client/scripts/views/components/CommunityInformationForm/constants';
import { useState } from 'react';
import { trpc } from 'utils/trpcClient';
import { fetchNodes } from '../nodes';

export const useClaimTokenFlow = () => {
  const utils = trpc.useUtils();
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null,
  );
  const claimToken = trpc.tokenAllocation.claimToken.useMutation();
  const updateClaimTransactionHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation();

  const claim = async (input: Parameters<typeof claimToken.mutateAsync>[0]) => {
    try {
      const data = await claimToken.mutateAsync(input);
      // invalidate related queries
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
      utils.tokenAllocation.getAllocation
        .invalidate({ magna_allocation_id: data.magna_allocation_id })
        .catch(console.error);

      let txHash = data.transaction_hash;
      // sign and persist transaction hash the first time
      if (!txHash) {
        const nodes = await fetchNodes();
        const baseNode = nodes?.find(
          (node) => node.ethChainId === parseInt(BASE_ID),
        );
        if (!baseNode) throw new Error('Failed to find base node');

        const stc = new SignTokenClaim(data.to, baseNode.url);
        txHash = await stc.sign(data.from, `${baseNode.ethChainId}`, data.data);
        // at this point the claim transaction is signed!
        // ...next line is best effort to persist the tx hash to complete the flow
        // ...if this fails, the user will have to claim again (is singing idempotent?)
        await updateClaimTransactionHash.mutateAsync({
          transaction_hash: txHash,
        });
      }
      // update the UI
      setTransactionHash(txHash);
      notifySuccess('Token claimed successfully');
    } catch (error) {
      notifyError(error.message ?? 'Something went wrong');
      throw error; // let caller handle if needed
    }
  };

  return {
    claim,
    transactionHash,
    isPending: claimToken.isPending || updateClaimTransactionHash.isPending,
  };
};
