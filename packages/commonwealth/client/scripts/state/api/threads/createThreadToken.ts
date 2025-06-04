import {
  commonProtocol,
  mustBeProtocolChainId,
  toContractObject,
} from '@hicommonwealth/evm-protocols';
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
  mustBeProtocolChainId(ethChainId);
  const factoryContracts = toContractObject(
    commonProtocol.factoryContracts[ethChainId],
  );

  if (
    !factoryContracts?.postTokenLaunchpad ||
    !factoryContracts?.postTokenBondingCurve
  ) {
    throw new Error(
      `Factory configuration is missing for chain ID ${ethChainId}. Please check your commonProtocol configuration.`,
    );
  }

  const factoryAddress = factoryContracts.postTokenLaunchpad;
  const bondingCurve = factoryContracts.postTokenBondingCurve;

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
      communityTreasuryAddress,
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
