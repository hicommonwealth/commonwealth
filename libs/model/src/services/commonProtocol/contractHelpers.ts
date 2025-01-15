import { AppError } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { BalanceSourceType } from '@hicommonwealth/shared';

import { Balances, getBalances } from '../tokenBalanceCache';

/**
 * gets the balances of an id for multiple addresses on a namespace
 * @param namespaceAddress the contract address of the deployed namespace
 * @param tokenId ERC1155 id(ie 0 for admin token, default 2 for CommunityStake)
 * @param chain chainNode to use(must be chain with deployed protocol)
 * @param addresses User address to check balance
 * @returns balance in wei
 */
export const getNamespaceBalance = async (
  namespaceAddress: string,
  tokenId: number,
  chain: commonProtocol.ValidChains,
  addresses: string[],
): Promise<Balances> => {
  const factoryData = commonProtocol.factoryContracts[chain];
  if (!namespaceAddress) {
    throw new AppError('No namespace provided!');
  }
  return await getBalances({
    balanceSourceType: BalanceSourceType.ERC1155,
    addresses,
    sourceOptions: {
      contractAddress: namespaceAddress,
      evmChainId: factoryData.chainId,
      tokenId: tokenId,
    },
    cacheRefresh: true,
  });
};
