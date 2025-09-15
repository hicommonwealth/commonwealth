import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import SignTokenClaim from 'client/scripts/helpers/ContractHelpers/signTokenClaim';
import { BASE_ID } from 'client/scripts/views/components/CommunityInformationForm/constants';
import { useState } from 'react';
import { trpc } from 'utils/trpcClient';
import { fetchNodes } from '../nodes';

export const useClaimAndSignToken = () => {
  const utils = trpc.useUtils();
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null,
  );

  // step 1: claim allocation (server)
  const claimToken = trpc.tokenAllocation.claimToken.useMutation();

  // step 2: persist tx hash (server)
  const updateClaimTransactionHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation();

  // orchestrated workflow
  const run = async (input: Parameters<typeof claimToken.mutateAsync>[0]) => {
    try {
      // 1. claim allocation
      const data = await claimToken.mutateAsync(input);

      // invalidate related queries
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
      utils.tokenAllocation.getAllocation
        .invalidate({ magna_allocation_id: data.magna_allocation_id })
        .catch(console.error);

      let txHash = data.transaction_hash;

      // 2. if no tx hash, sign client-side and persist
      if (!txHash) {
        const nodes = await fetchNodes();
        const baseNode = nodes?.find(
          (node) => node.ethChainId === parseInt(BASE_ID),
        );
        if (!baseNode) {
          throw new Error('Failed to find base node');
        }

        const stc = new SignTokenClaim(data.to, baseNode.url);
        txHash = await stc.sign(data.from, `${baseNode.ethChainId}`, data.data);
        await updateClaimTransactionHash.mutateAsync({
          transaction_hash: txHash,
        });
      }

      setTransactionHash(txHash);
      notifySuccess('Token claimed successfully');
      return txHash;
    } catch (error: any) {
      notifyError(error.message ?? 'Something went wrong');
      throw error; // let caller handle if needed
    }
  };

  return {
    run,
    transactionHash,
    isPending: claimToken.isPending || updateClaimTransactionHash.isPending,
  };
};
