import { notifyError, notifySuccess } from 'controllers/app/notifications';
import MagicWebWalletController from 'controllers/app/webWallets/MagicWebWallet';
import CommonClaim from 'helpers/ContractHelpers/CommonClaim';
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
    requiredEth?: string | number;
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

export const useCommonAirdrop = ({ tokenSymbol }: { tokenSymbol?: string }) => {
  const utils = trpc.useUtils();

  const { txData, initialTxHash, finalTxHash, setData } =
    useCommonAirdropStore();

  const claimInitialToken = trpc.tokenAllocation.claimToken.useMutation();
  const updateInitialClaimTxHash =
    trpc.tokenAllocation.updateClaimTransactionHash.useMutation();

  const claimFinalToken = trpc.tokenAllocation.claimTokenCliff.useMutation();
  const updateFinalClaimTxHash =
    trpc.tokenAllocation.updateClaimCliffTransactionHash.useMutation();

  const getWalletProvider = async (claimFromAddress: string) => {
    const userAddresses = userStore.getState().addresses;
    const isMagicAddress = userAddresses.some(
      (addr) =>
        addr.address.toLowerCase() === claimFromAddress.toLowerCase() &&
        addr.walletId?.toLowerCase().includes('magic'),
    );
    const nodes = await fetchNodes();
    if (isMagicAddress) {
      const controller = new MagicWebWalletController();
      await controller.enable(`${BASE_ID}`);

      return { isMagicAddress, provider: controller.provider };
    } else {
      const baseNode = nodes?.find(
        (node) => node.ethChainId === parseInt(BASE_ID),
      );
      if (!baseNode) throw new Error('Failed to find base node');

      return { isMagicAddress: false, provider: baseNode.url };
    }
  };

  const claimToken = (type: 'initial' | 'final') => {
    const claimFunction =
      type === 'initial'
        ? claimInitialToken.mutateAsync
        : claimFinalToken.mutateAsync;
    const txHashUpdateFunction =
      type === 'initial'
        ? updateInitialClaimTxHash.mutateAsync
        : updateFinalClaimTxHash.mutateAsync;

    return async (
      input: Parameters<typeof claimFunction>[0] & { claimAddress: string },
    ) => {
      try {
        userStore.setState({
          addressSelectorSelectedAddress: input.claimAddress,
        });
        const data = await claimFunction({
          allocation_id: input.allocation_id,
        });
        setData({
          txData: {
            to: data.to,
            data: data.data,
          },
        });

        let txHash = data.transaction_hash;
        // sign and persist transaction hash the first time
        if (!txHash) {
          const { isMagicAddress, provider } = await getWalletProvider(
            data.from,
          );
          const stc = new CommonClaim(
            data.to,
            tokenSymbol || 'C',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            provider as any,
          );
          txHash = await stc.sign(
            data.from,
            `${BASE_ID}`,
            data.data,
            type === 'initial',
            (requiredEth: string | number) => {
              setData({
                txData: {
                  to: data.to,
                  data: data.data,
                  requiredEth,
                },
              });
            },
            isMagicAddress ? provider : undefined,
          );
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
        if (error.message?.includes('BlockNotFound')) {
          notifyError('Tx block index pending!');
        } else {
          notifyError(error.message ?? 'Something went wrong');
        }
        throw error; // let caller handle if needed
      } finally {
        // invalidate related queries
        utils.tokenAllocation.getClaimAddress.invalidate().catch(console.error);
        utils.tokenAllocation.getAllocation
          .invalidate({ magna_allocation_id: input.allocation_id })
          .catch(console.error);
        userStore.setState({
          addressSelectorSelectedAddress: undefined,
        });
      }
    };
  };
  const claimInitial = claimToken('initial');
  const claimFinal = claimToken('final');

  return {
    txData,
    getWalletProvider,
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
