import { AppError } from '@hicommonwealth/adapters';
import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { BalanceSourceType } from '@hicommonwealth/core';
import { DB, TokenBalanceCache } from '@hicommonwealth/model';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

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
 * gets the balance of an id for an address on a namespace
 * @param tbc TokenBalanceCache instance
 * @param namespace namespace name
 * @param tokenId ERC1155 id(ie 0 for admin token, default 2 for CommunityStake)
 * @param chain chainNode to use(must be chain with deployed protocol)
 * @param address User address to check balance
 * @param model Database
 * @returns balance in wei
 */
export const getNamespaceBalance = async (
  tbc: TokenBalanceCache,
  namespace: string,
  tokenId: number,
  chain: ValidChains,
  address: string,
  model: DB,
): Promise<string> => {
  const factoryData = factoryContracts[chain];
  const node = await model.ChainNode.findOne({
    where: {
      eth_chain_id: factoryData.chainId,
    },
    attributes: ['url'],
  });
  if (node) {
    const web3 = new Web3(node.url);
    const activeNamespace = await getNamespace(
      web3,
      namespace,
      factoryData.factory,
    );
    if (activeNamespace === '0x0000000000000000000000000000000000000000') {
      throw new AppError('Namespace not found for this name');
    }
    const balance = await tbc.getBalances({
      balanceSourceType: BalanceSourceType.ERC1155,
      addresses: [address],
      sourceOptions: {
        contractAddress: activeNamespace,
        evmChainId: factoryData.chainId,
        tokenId: tokenId,
      },
      cacheRefresh: true,
    });
    return balance[address];
  } else {
    throw new AppError('ChainNode not found');
  }
};
