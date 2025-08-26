import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import TokenLaunchpad from 'helpers/ContractHelpers/tokenLaunchpad';
import { resetBalancesCache } from '../launchPad/helpers/resetBalancesCache';

export interface BuyThreadTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountIn: number;
  walletAddress: string;
  minAmountOut: number;
  paymentTokenAddress: string;
}

const buyThreadToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountIn,
  walletAddress,
  minAmountOut,
  paymentTokenAddress,
}: BuyThreadTokenProps) => {
  if (
    !ethChainId ||
    !chainRpc ||
    !tokenAddress ||
    !walletAddress ||
    !paymentTokenAddress
  ) {
    throw new Error('Missing required parameters for thread token purchase');
  }

  const factoryContract = getFactoryContract(ethChainId);
  if (!factoryContract) {
    throw new Error(`Factory contract not found for chain ID: ${ethChainId}`);
  }

  const factoryAddress = factoryContract.TokenLaunchpad;
  const bondingCurve = factoryContract.TokenBondingCurve;

  if (!factoryAddress || !bondingCurve) {
    throw new Error(
      `Factory configuration is missing for chain ID ${ethChainId}. Please check your commonProtocol configuration.`,
    );
  }

  const tokenLaunchpad = new TokenLaunchpad(
    factoryAddress,
    bondingCurve,
    paymentTokenAddress,
    chainRpc,
  );

  return await tokenLaunchpad.buyTokens(
    tokenAddress,
    walletAddress,
    amountIn.toString(),
    minAmountOut.toString(),
    walletAddress,
  );
};

const useBuyThreadTokenMutation = () => {
  return useMutation({
    mutationFn: buyThreadToken,
    onSuccess: async (_, variables) => {
      await resetBalancesCache(_, variables);
    },
  });
};

export default useBuyThreadTokenMutation;
