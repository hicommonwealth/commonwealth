import { trpc } from 'utils/trpcClient';
import { getUserEthBalanceQueryKey } from '../../communityStake/getUserEthBalance';
import { queryClient } from '../../config';
import { getERC20BalanceQueryKey } from '../../tokens/getERC20Balance';
import { BuyTokenProps } from '../buyToken';
import { getTokenEthExchangeRateQueryKey } from '../tokenEthExchangeRate';

export const resetBalancesCache = async (
  _: unknown,
  variables: Omit<BuyTokenProps, 'amountEth'>,
  trpcUtils: ReturnType<typeof trpc.useUtils>,
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
  await trpcUtils.token.getTokens.invalidate();
  await trpcUtils.token.getTokens.refetch();
  await trpcUtils.token.getToken.invalidate();
};
