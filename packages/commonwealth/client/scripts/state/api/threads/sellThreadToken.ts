import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import TokenLaunchpad from 'helpers/ContractHelpers/tokenLaunchpad';
import { resetBalancesCache } from '../launchPad/helpers/resetBalancesCache';

export interface SellThreadTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountToken: number;
  walletAddress: string;
  paymentTokenAddress: string;
}

const sellThreadToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountToken,
  walletAddress,
  paymentTokenAddress,
}: SellThreadTokenProps) => {
  if (
    !ethChainId ||
    !chainRpc ||
    !tokenAddress ||
    !amountToken ||
    !walletAddress ||
    !paymentTokenAddress
  ) {
    throw new Error('Missing required parameters for thread token purchase');
  }

  const factoryAddress = getFactoryContract(ethChainId).TokenLaunchpad;
  const bondingCurve = getFactoryContract(ethChainId).TokenBondingCurve;

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

  return await tokenLaunchpad.sellTokens(
    tokenAddress,
    amountToken.toString(),
    '0',
    walletAddress,
  );
};

const useSellThreadTokenMutation = () => {
  return useMutation({
    mutationFn: sellThreadToken,
    onSuccess: async (_, variables) => {
      await resetBalancesCache(_, variables);
    },
  });
};

export default useSellThreadTokenMutation;
