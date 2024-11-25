import { getUserEthBalanceQueryKey } from '../../communityStake/getUserEthBalance';
import { queryClient } from '../../config';
import { getERC20BalanceQueryKey } from '../../tokens/getERC20Balance';
import { BuyTokenProps } from '../buyToken';
import { getTokenEthExchangeRateQueryKey } from '../tokenEthExchangeRate';

export const resetBalancesCache = async (
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
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const [path] = query.queryKey;
      if (Array.isArray(path) && path.length === 2) {
        const [entity, name] = path;
        if (
          entity === 'token' &&
          (name === 'getTokens' || name === 'getToken')
        ) {
          return true;
        }
      }
      return false;
    },
  });
};
