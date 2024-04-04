import {
  AppError,
  BalanceSourceType,
  commonProtocol,
} from '@hicommonwealth/core';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Balances, getBalances } from '../tokenBalanceCache';

export const getNamespace = async (
  web3: Web3,
  namespace: string,
  factoryAddress: string,
): Promise<string> => {
  const factory = new web3.eth.Contract(
    [
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'getNamespace',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
      },
    ] as AbiItem[],
    factoryAddress,
  );

  const hexString = web3.utils.utf8ToHex(namespace);
  const activeNamespace = await factory.methods.getNamespace(hexString).call();
  return activeNamespace;
};

/**
 * gets the balances of an id for multiple addresses on a namespace
 * @param namespaceAddress the contract address of the deployed namespace
 * @param tokenId ERC1155 id(ie 0 for admin token, default 2 for CommunityStake)
 * @param chain chainNode to use(must be chain with deployed protocol)
 * @param addresses User address to check balance
 * @param nodeUrl The RPC url of the node
 * @returns balance in wei
 */
export const getNamespaceBalance = async (
  namespaceAddress: string,
  tokenId: number,
  chain: commonProtocol.ValidChains,
  addresses: string[],
  nodeUrl: string,
): Promise<Balances> => {
  const factoryData = commonProtocol.factoryContracts[chain];
  if (nodeUrl) {
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
  } else {
    throw new AppError('ChainNode not found');
  }
};
