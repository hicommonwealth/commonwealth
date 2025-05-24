import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import TokenLaunchpad from 'helpers/ContractHelpers/tokenLaunchpad';

export interface CreateThreadTokenProps {
  name: string;
  symbol: string;
  threadId: number;
  initPurchaseAmount: number;
  chainId: number;
  walletAddress: string;
  authorAddress: string;
  communityTreasuryAddress: string;
  chainRpc: string;
  paymentTokenAddress: string;
  ethChainId: number;
}

export const createThreadToken = async ({
  name,
  symbol,
  threadId,
  initPurchaseAmount,
  chainId,
  walletAddress,
  authorAddress,
  communityTreasuryAddress,
  paymentTokenAddress,
  ethChainId,
  chainRpc,
}: CreateThreadTokenProps) => {
  if (
    !commonProtocol.factoryContracts ||
    !commonProtocol.factoryContracts[ethChainId] ||
    !commonProtocol.factoryContracts[ethChainId].factory
  ) {
    throw new Error(
      `Factory configuration is missing for chain ID ${ethChainId}. Please check your commonProtocol configuration.`,
    );
  }

  const factoryAddress =
    commonProtocol.factoryContracts[ethChainId].postTokenLaunchpad;
  const bondingCurve =
    commonProtocol.factoryContracts[ethChainId].postTokenBondingCurve;

  const launchpad = new TokenLaunchpad(
    factoryAddress,
    bondingCurve,
    paymentTokenAddress,
    chainRpc,
  );

  try {
    return await launchpad.launchTokenWithLiquidity(
      name,
      symbol,
      walletAddress,
      threadId,
      paymentTokenAddress,
      chainId.toString(),
      initPurchaseAmount,
      authorAddress,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (communityTreasuryAddress = '0x0771bf1205506a1d8ad2340dee334c1eb031e48c'),
    );
  } catch (error) {
    console.error('Error in createThreadToken:', {
      error,
    });
    throw error;
  }
};

const useCreateThreadTokenMutation = () => {
  return useMutation({
    mutationFn: createThreadToken,
  });
};

export default useCreateThreadTokenMutation;
