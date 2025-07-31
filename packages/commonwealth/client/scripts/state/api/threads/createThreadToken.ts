import {
  getFactoryContract,
  mustBeProtocolChainId,
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

  if (
    !getFactoryContract(ethChainId).TokenLaunchpad ||
    !getFactoryContract(ethChainId).TokenBondingCurve
  ) {
    throw new Error(
      `Factory configuration is missing for chain ID ${ethChainId}. Please check your commonProtocol configuration.`,
    );
  }

  const factoryAddress = getFactoryContract(ethChainId).TokenLaunchpad;
  const bondingCurve = getFactoryContract(ethChainId).TokenBondingCurve;

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
