import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import MagicWebWalletController from 'client/scripts/controllers/app/webWallets/MagicWebWallet';
import SignTokenClaim from 'client/scripts/helpers/ContractHelpers/signTokenClaim';
import { BASE_ID } from 'client/scripts/views/components/CommunityInformationForm/constants';
import { useState } from 'react';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';
import { fetchNodes } from '../nodes';

export const useClaimTokenFlow = () => {
  const utils = trpc.useUtils();
  const [claimTxData, setClaimTxData] = useState<{
    to: string;
    data: string;
  }>();

  const [initialClaimTxHash, setInitialClaimTxHash] = useState<
    `0x${string}` | null
  >(null);
  const claimInitialToken = trpc.tokenAllocation.claimToken.useMutation();
  const updateInitialClaimTxHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation();
  const claimInitial = async (
    input: Parameters<typeof claimInitialToken.mutateAsync>[0],
  ) => {
    try {
      const data = await claimInitialToken.mutateAsync(input);
      setClaimTxData({
        to: data.to,
        data: data.data,
      });
      // invalidate related queries
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
      utils.tokenAllocation.getAllocation
        .invalidate({ magna_allocation_id: data.magna_allocation_id })
        .catch(console.error);

      let txHash = data.transaction_hash;
      // sign and persist transaction hash the first time
      if (!txHash) {
        const userAddresses = userStore.getState().addresses;
        const isMagicAddress = userAddresses.some(
          (addr) =>
            addr.address.toLowerCase() === data.from.toLowerCase() &&
            addr.walletId?.toLowerCase().includes('magic'),
        );
        if (isMagicAddress) {
          // Ensure nodes are fetched (kept for side effects if needed)
          await fetchNodes();

          const controller = new MagicWebWalletController();
          await controller.enable(`${BASE_ID}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stc = new SignTokenClaim(data.to, controller.provider as any);
          txHash = await stc.sign(
            data.from,
            `${BASE_ID}`,
            data.data,
            controller.provider,
          );
        } else {
          const nodes = await fetchNodes();
          const baseNode = nodes?.find(
            (node) => node.ethChainId === parseInt(BASE_ID),
          );
          if (!baseNode) throw new Error('Failed to find base node');

          const stc = new SignTokenClaim(data.to, baseNode.url);
          txHash = await stc.sign(
            data.from,
            `${baseNode.ethChainId}`,
            data.data,
          );
        }
        // at this point the claim transaction is signed!
        // ...next line is best effort to persist the tx hash to complete the flow
        // ...if this fails, the user will have to claim again (is singing idempotent?)
        txHash &&
          (await updateInitialClaimTxHash.mutateAsync({
            transaction_hash: txHash,
          }));
      }
      // update the UI
      txHash && setInitialClaimTxHash(txHash);
      notifySuccess('Token claimed successfully');
    } catch (error) {
      notifyError(error.message ?? 'Something went wrong');
      throw error; // let caller handle if needed
    }
  };

  const [finalClaimTxHash, setFinalClaimTxHash] = useState<
    `0x${string}` | null
  >(null);
  const claimFinalToken = trpc.tokenAllocation.claimTokenCliff.useMutation();
  const updateFinalClaimTxHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation();
  const claimFinal = async (
    input: Parameters<typeof claimFinalToken.mutateAsync>[0],
  ) => {
    try {
      const data = await claimFinalToken.mutateAsync(input);
      setClaimTxData({
        to: data.to,
        data: data.data,
      });
      // invalidate related queries
      utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
      utils.tokenAllocation.getAllocation
        .invalidate({ magna_allocation_id: data.magna_allocation_id })
        .catch(console.error);

      let txHash = data.transaction_hash;
      // sign and persist transaction hash the first time
      if (!txHash) {
        const userAddresses = userStore.getState().addresses;
        const isMagicAddress = userAddresses.some(
          (addr) =>
            addr.address.toLowerCase() === data.from.toLowerCase() &&
            addr.walletId?.toLowerCase().includes('magic'),
        );
        if (isMagicAddress) {
          // Ensure nodes are fetched (kept for side effects if needed)
          await fetchNodes();

          const controller = new MagicWebWalletController();
          await controller.enable(`${BASE_ID}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stc = new SignTokenClaim(data.to, controller.provider as any);
          txHash = await stc.sign(
            data.from,
            `${BASE_ID}`,
            data.data,
            controller.provider,
          );
        } else {
          const nodes = await fetchNodes();
          const baseNode = nodes?.find(
            (node) => node.ethChainId === parseInt(BASE_ID),
          );
          if (!baseNode) throw new Error('Failed to find base node');

          const stc = new SignTokenClaim(data.to, baseNode.url);
          txHash = await stc.sign(
            data.from,
            `${baseNode.ethChainId}`,
            data.data,
          );
        }
        // at this point the claim transaction is signed!
        // ...next line is best effort to persist the tx hash to complete the flow
        // ...if this fails, the user will have to claim again (is singing idempotent?)
        txHash &&
          (await updateFinalClaimTxHash.mutateAsync({
            transaction_hash: txHash,
          }));
      }
      // update the UI
      txHash && setFinalClaimTxHash(txHash);
      notifySuccess('Token claimed successfully');
    } catch (error) {
      notifyError(error.message ?? 'Something went wrong');
      throw error; // let caller handle if needed
    }
  };

  return {
    claimTxData,
    initial: {
      claim: claimInitial,
      txHash: initialClaimTxHash,
      isPending:
        claimInitialToken.isPending || updateInitialClaimTxHash.isPending,
    },
    final: {
      claim: claimFinal,
      txHash: finalClaimTxHash,
      isPending: claimFinalToken.isPending || updateFinalClaimTxHash.isPending,
    },
  };
};
