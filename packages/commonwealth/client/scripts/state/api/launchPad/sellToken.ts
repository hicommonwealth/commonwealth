import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { getMagicForChain } from 'utils/magicNetworkUtils';
import { createMagicWalletError } from 'utils/magicWalletErrors';
import { resetBalancesCache } from './helpers/resetBalancesCache';

interface SellTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountToken: number;
  walletAddress: string;
}

const sellToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountToken,
  walletAddress,
}: SellTokenProps) => {
  // Check if the selected address belongs to a Magic user
  const userAddresses = userStore.getState().addresses;
  const isMagicAddress = userAddresses.some(
    (addr) =>
      addr.address.toLowerCase() === walletAddress.toLowerCase() &&
      addr.walletId?.toLowerCase().includes('magic'),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let magicProvider: any = null;
  if (isMagicAddress) {
    const magic = getMagicForChain(ethChainId);
    if (magic) {
      magicProvider = magic.rpcProvider;
    } else {
      // Handle error appropriately - maybe throw or notify
      throw new Error('Could not initialize Magic for transaction.');
    }
  }

  const launchPad = new LaunchpadBondingCurve(
    getFactoryContract(ethChainId).LPBondingCurve,
    getFactoryContract(ethChainId).Launchpad,
    tokenAddress,
    getFactoryContract(ethChainId).TokenCommunityManager,
    chainRpc,
  );

  try {
    return await launchPad.sellToken(
      amountToken,
      walletAddress,
      `${ethChainId}`,
      magicProvider,
    );
  } catch (error) {
    // Enhanced error handling for Magic wallet users
    if (isMagicAddress && error instanceof Error) {
      const magicError = createMagicWalletError(error);

      // Create a new error with enhanced message for Magic wallet users
      const enhancedError = new Error(magicError.message);
      enhancedError.name =
        magicError.type === 'insufficient_funds'
          ? 'MagicInsufficientFundsError'
          : 'MagicWalletError';

      // Preserve original error details for debugging
      (enhancedError as any).originalError = error;
      (enhancedError as any).magicErrorType = magicError.type;
      (enhancedError as any).actionRequired = magicError.actionRequired;
      (enhancedError as any).isMagicWallet = true;

      throw enhancedError;
    }

    // Re-throw original error for non-Magic wallets
    throw error;
  }
};

const useSellTokenMutation = () => {
  return useMutation({
    mutationFn: sellToken,
    onSuccess: async (_, variables) => {
      await resetBalancesCache(_, variables);
    },
  });
};

export default useSellTokenMutation;
