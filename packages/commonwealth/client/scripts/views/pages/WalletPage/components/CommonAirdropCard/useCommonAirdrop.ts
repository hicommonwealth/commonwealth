import { notifyError, notifySuccess } from 'controllers/app/notifications';
import MagicWebWalletController from 'controllers/app/webWallets/MagicWebWallet';
import CommonClaim from 'helpers/ContractHelpers/CommonClaim';
import { useEffect } from 'react';
import { fetchNodes } from 'state/api/nodes/fetchNodes';
import { userStore } from 'state/ui/user';
import { createBoundedUseStore } from 'state/ui/utils';
import { trpc } from 'utils/trpcClient';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { BASE_ID } from 'views/components/CommunityInformationForm/constants';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { getWithdrawTransactionsForAddress } from './util';

type CommonAirdropData = {
  txData?: {
    to: string;
    data: string;
    requiredEth?: string | number;
  };
  initialTxHash: `0x${string}` | null;
  shouldRetryInitialTx: boolean;
  finalTxHash: `0x${string}` | null;
  shouldRetryFinalTx: boolean;
};

interface CommonAirdropState extends CommonAirdropData {
  setData: (data: Partial<CommonAirdropData>) => void;
}

export const commonAirdropStore = createStore<CommonAirdropState>()(
  devtools((set) => ({
    txData: undefined,
    initialTxHash: null,
    finalTxHash: null,
    shouldRetryInitialTx: false,
    shouldRetryFinalTx: false,
    setData: (data) => {
      if (Object.keys(data).length > 0) {
        set((state) => ({ ...state, ...data }));
      }
    },
  })),
);

const useCommonAirdropStore = createBoundedUseStore(commonAirdropStore);

export const useCommonAirdrop = ({
  tokenSymbol,
  userClaimAddress,
  magnaContractAddress,
  shouldCheckInitialTransactionStatus = false,
  shouldCheckFinalTransactionStatus = false,
}: {
  tokenSymbol?: string;
  userClaimAddress?: string;
  magnaContractAddress?: string;
  shouldCheckInitialTransactionStatus?: boolean;
  shouldCheckFinalTransactionStatus?: boolean;
}) => {
  const utils = trpc.useUtils();

  const {
    txData,
    initialTxHash,
    finalTxHash,
    shouldRetryInitialTx,
    shouldRetryFinalTx,
    setData,
  } = useCommonAirdropStore();

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
        }
        // at this point the claim transaction is signed!
        // update the UI
        if (txHash) {
          await new Promise((r) => setTimeout(r, 5000)); // wait 5 sec for the block to propagate

          await txHashUpdateFunction({
            transaction_hash: txHash,
          })
            .then(() => {
              setData({
                shouldRetryInitialTx: false,
                shouldRetryFinalTx: false,
                [type === 'initial' ? 'initialTxHash' : 'finalTxHash']: txHash,
              });
            })
            .catch(console.error); // this shouldn't throw errors
        }
        notifySuccess('Token claimed successfully');
      } catch (error) {
        if (error.message?.includes('BlockNotFound')) {
          notifyError('Tx block index pending!');
        } else {
          notifyError(error.message ?? 'Something went wrong');
        }
        throw error; // let caller handle if needed
      } finally {
        utils.tokenAllocation.invalidate().catch(console.error);
        userStore.setState({
          addressSelectorSelectedAddress: undefined,
        });
      }
    };
  };
  const claimInitial = claimToken('initial');
  const claimFinal = claimToken('final');

  useEffect(() => {
    if (
      (!shouldCheckInitialTransactionStatus &&
        !shouldCheckFinalTransactionStatus) ||
      !userClaimAddress ||
      !magnaContractAddress ||
      shouldRetryInitialTx ||
      shouldRetryFinalTx
    ) {
      return;
    }
    const checkTransactionStatus = async () => {
      try {
        // Fetch Base chain node to get RPC URL
        const nodes = await fetchNodes();
        const baseNode = nodes?.find(
          (node) => node.ethChainId === parseInt(BASE_ID),
        );

        if (!baseNode?.url) {
          console.error('Base node not found');
          return;
        }

        // Create viem public client for Base chain
        const client = createPublicClient({
          chain: base,
          transport: http(baseNode.url),
        });

        // Get the block number from when magna_claimed_at was set (we'll use recent blocks as fallback)
        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock - BigInt(500_000); // Check last 500,000 blocks, TODO: adjust this

        // Fetch withdraw transactions for the user's claim address
        const transactions = await getWithdrawTransactionsForAddress(
          client,
          magnaContractAddress, // contract address
          userClaimAddress, // user's claim address
          fromBlock,
        );

        // [0] is latest
        transactions.sort((a, b) =>
          Number(BigInt(b.timestamp) - BigInt(a.timestamp)),
        );

        if (transactions.length > 0) {
          const revertedTx = transactions[0].status === 'reverted';

          if (revertedTx) {
            if (shouldCheckInitialTransactionStatus) {
              setData({ shouldRetryInitialTx: true });
            } else if (shouldCheckFinalTransactionStatus) {
              setData({ shouldRetryFinalTx: true });
            }
          } else {
            // Find successful transaction
            const successfulTx = transactions.find(
              (tx) => tx.status === 'success',
            );
            if (successfulTx) {
              // Update with successful transaction hash
              if (shouldCheckInitialTransactionStatus) {
                setData({
                  shouldRetryInitialTx: false,
                  initialTxHash: successfulTx.txHash as `0x${string}`,
                });
                await updateInitialClaimTxHash.mutateAsync({
                  transaction_hash: successfulTx.txHash as `0x${string}`,
                });
              } else if (shouldCheckFinalTransactionStatus) {
                setData({
                  shouldRetryFinalTx: false,
                  finalTxHash: successfulTx.txHash as `0x${string}`,
                });
                await updateFinalClaimTxHash.mutateAsync({
                  transaction_hash: successfulTx.txHash as `0x${string}`,
                });
              }

              await utils.tokenAllocation.invalidate().catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    const interval = setInterval(() => {
      checkTransactionStatus().catch(console.error);
    }, 5_000); // every 5 seconds

    return () => {
      interval && clearInterval(interval);
    };
  }, [
    shouldRetryInitialTx,
    shouldRetryFinalTx,
    shouldCheckInitialTransactionStatus,
    shouldCheckFinalTransactionStatus,
    magnaContractAddress,
    userClaimAddress,
    setData,
    utils?.tokenAllocation,
    updateInitialClaimTxHash,
    updateFinalClaimTxHash,
  ]);

  return {
    txData,
    getWalletProvider,
    initial: {
      claim: claimInitial,
      txHash: initialTxHash,
      isPending:
        claimInitialToken.isPending || updateInitialClaimTxHash.isPending,
      shouldRetry: shouldRetryInitialTx,
    },
    final: {
      claim: claimFinal,
      txHash: finalTxHash,
      isPending: claimFinalToken.isPending || updateFinalClaimTxHash.isPending,
      shouldRetry: shouldRetryFinalTx,
    },
  };
};
