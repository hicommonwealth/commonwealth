import { commonProtocol } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { getUserEthBalanceQueryKey } from '../communityStake/getUserEthBalance';
import { queryClient } from '../config';
import { getERC20BalanceQueryKey } from '../tokens/getERC20Balance';
import { getTokenEthExchangeRateQueryKey } from './tokenEthExchangeRate';

interface BuyTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountEth: number;
  walletAddress: string;
}

const buyToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountEth,
  walletAddress,
}: BuyTokenProps) => {
  const launchPad = new LaunchpadBondingCurve(
    commonProtocol.factoryContracts[ethChainId].lpBondingCurve,
    commonProtocol.factoryContracts[ethChainId].launchpad,
    tokenAddress,
    commonProtocol.factoryContracts[ethChainId].tokenCommunityManager,
    chainRpc,
  );

  return await launchPad.buyToken(amountEth, walletAddress, `${ethChainId}`);
};

export const handleQuerySuccess = async (
  _: unknown,
  variables: Omit<BuyTokenProps, 'amountEth'>,
) => {
  await queryClient.invalidateQueries({
    queryKey: getUserEthBalanceQueryKey({
      chainRpc: variables.chainRpc,
      ethChainId: variables.ethChainId,
      walletAddress: variables.walletAddress,
    }),
  });
  await queryClient.invalidateQueries({
    queryKey: getERC20BalanceQueryKey({
      tokenAddress: variables.tokenAddress,
      userAddress: variables.walletAddress,
      nodeRpc: variables.chainRpc,
    }),
  });
  await queryClient.invalidateQueries({
    queryKey: getTokenEthExchangeRateQueryKey({
      chainRpc: variables.chainRpc,
      ethChainId: variables.ethChainId,
      mode: 'buy',
      tokenAddress: variables.tokenAddress,
      tokenAmount: 1 * 1e18, // amount per unit
    }),
  });
  await queryClient.invalidateQueries({
    queryKey: getTokenEthExchangeRateQueryKey({
      chainRpc: variables.chainRpc,
      ethChainId: variables.ethChainId,
      mode: 'sell',
      tokenAddress: variables.tokenAddress,
      tokenAmount: 1 * 1e18, // amount per unit
    }),
  });
};

const useBuyTokenMutation = () => {
  return useMutation({
    mutationFn: buyToken,
    onSuccess: handleQuerySuccess,
  });
};

export default useBuyTokenMutation;
