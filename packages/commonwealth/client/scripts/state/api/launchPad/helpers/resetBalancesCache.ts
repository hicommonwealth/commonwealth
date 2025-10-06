import { getUserEthBalanceQueryKey } from '../../communityStake/getUserEthBalance';
import { queryClient } from '../../config';
import { getERC20BalanceQueryKey } from '../../tokens/getERC20Balance';
import { BuyTokenProps } from '../buyToken';
import { getTokenEthExchangeRateQueryKey } from '../tokenEthExchangeRate';

export const resetBalancesCache = async (
  _: unknown,
  variables: Omit<BuyTokenProps, 'amountEth'> & {
    paymentTokenAddress?: string;
  },
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

  if (variables.paymentTokenAddress) {
    await queryClient.invalidateQueries({
      queryKey: getERC20BalanceQueryKey({
        tokenAddress: variables.paymentTokenAddress,
        userAddress: variables.walletAddress,
        nodeRpc: variables.chainRpc,
      }),
    });
  }

  await queryClient.invalidateQueries({
    predicate: (query) => {
      const [key] = query.queryKey;
      return (
        Array.isArray(key) &&
        key.length === 3 &&
        key[0] === variables.walletAddress &&
        key[2] === variables.chainRpc
      );
    },
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
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const [key] = query.queryKey;
      return (
        typeof key === 'string' &&
        (key.startsWith('TOKEN_ETH_EXCHANGE_RATE') ||
          key.startsWith('ETH_PER_TOKEN'))
      );
    },
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
