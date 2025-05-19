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
  console.log('createThreadToken called with:', {
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
  });

  if (
    !commonProtocol.factoryContracts ||
    !commonProtocol.factoryContracts[ethChainId] ||
    !commonProtocol.factoryContracts[ethChainId].factory
  ) {
    throw new Error(
      `Factory configuration is missing for chain ID ${ethChainId}. Please check your commonProtocol configuration.`,
    );
  }

  const factoryAddress = commonProtocol.factoryContracts[ethChainId].factory;
  const bondingCurve =
    commonProtocol.factoryContracts[ethChainId].postTokenBondingCurve;

  const launchpad = new TokenLaunchpad(
    factoryAddress,
    bondingCurve,
    paymentTokenAddress,
    chainRpc,
  );

  try {
    const result = await launchpad.launchTokenWithLiquidity(
      name,
      symbol,
      walletAddress,
      threadId,
      paymentTokenAddress,
      chainId.toString(),
      initPurchaseAmount,
      authorAddress,
      communityTreasuryAddress,
    );

    console.log('Token launch successful:', result);
    return result;
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
