import { notifyError, notifySuccess } from 'controllers/app/notifications';
import MagicWebWalletController from 'controllers/app/webWallets/MagicWebWallet';
import SignTokenClaim from 'helpers/ContractHelpers/signTokenClaim';
import { fetchNodes } from 'state/api/nodes/fetchNodes';
import { userStore } from 'state/ui/user';
import { createBoundedUseStore } from 'state/ui/utils';
import { trpc } from 'utils/trpcClient';
import { BASE_ID } from 'views/components/CommunityInformationForm/constants';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type CommonAirdropData = {
  txData?: {
    to: string;
    data: string;
  };
  initialTxHash: `0x${string}` | null;
  finalTxHash: `0x${string}` | null;
};

interface CommonAirdropState extends CommonAirdropData {
  setData: (data: Partial<CommonAirdropData>) => void;
}

export const commonAirdropStore = createStore<CommonAirdropState>()(
  devtools((set) => ({
    txData: undefined,
    initialTxHash: null,
    finalTxHash: null,
    setData: (data) => {
      if (Object.keys(data).length > 0) {
        set((state) => ({ ...state, ...data }));
      }
    },
  })),
);

const useCommonAirdropStore = createBoundedUseStore(commonAirdropStore);

export const useCommonAirdrop = () => {
  const utils = trpc.useUtils();
  const { txData, initialTxHash, finalTxHash, setData } =
    useCommonAirdropStore();
  const claimInitialToken = trpc.tokenAllocation.claimToken.useMutation();
  const updateInitialClaimTxHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation();
  const claimFinalToken = trpc.tokenAllocation.claimTokenCliff.useMutation();
  const updateFinalClaimTxHash =
    trpc.tokenAllocation.updateClaimCliffTransactionHash.useMutation();

  const claimToken = (type: 'initial' | 'final') => {
    const claimFunction =
      type === 'initial'
        ? claimInitialToken.mutateAsync
        : claimFinalToken.mutateAsync;
    const txHashUpdateFunction =
      type === 'initial'
        ? updateInitialClaimTxHash.mutateAsync
        : updateFinalClaimTxHash.mutateAsync;

    return async (input: Parameters<typeof claimFunction>[0]) => {
      try {
        const data = await claimFunction(input);
        setData({
          txData: {
            to: data.to,
            data: data.data,
          },
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
              type === 'initial',
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
              type === 'initial',
            );
          }
          // at this point the claim transaction is signed!
          // ...next line is best effort to persist the tx hash to complete the flow
          // ...if this fails, the user will have to claim again (is singing idempotent?)
          txHash &&
            (await txHashUpdateFunction({
              transaction_hash: txHash,
            }));
        }
        // update the UI
        txHash &&
          setData({
            [type === 'initial' ? 'initialTxHash' : 'finalTxHash']: txHash,
          });
        notifySuccess('Token claimed successfully');
      } catch (error) {
        notifyError(error.message ?? 'Something went wrong');
        throw error; // let caller handle if needed
      }
    };
  };
  const claimInitial = claimToken('initial');
  const claimFinal = claimToken('final');

  return {
    txData,
    initial: {
      claim: claimInitial,
      txHash: initialTxHash,
      isPending:
        claimInitialToken.isPending || updateInitialClaimTxHash.isPending,
    },
    final: {
      claim: claimFinal,
      txHash: finalTxHash,
      isPending: claimFinalToken.isPending || updateFinalClaimTxHash.isPending,
    },
  };
};
