import { AppError } from '@hicommonwealth/core';
import { BalanceSourceType, commonProtocol } from '@hicommonwealth/shared';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Balances, TokenAttributes, getBalances } from '../tokenBalanceCache';
import { contestABI } from './abi/contestAbi';

export const getNamespace = async (
  rpcNodeUrl: string,
  namespace: string,
  factoryAddress: string,
): Promise<string> => {
  const web3 = new Web3(rpcNodeUrl);
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
  const activeNamespace = await factory.methods
    .getNamespace(hexString.padEnd(66, '0'))
    .call();
  return String(activeNamespace);
};

/**
 * gets the balances of an id for multiple addresses on a namespace
 * @param namespaceAddress the contract address of the deployed namespace
 * @param tokenId ERC1155 id(ie 0 for admin token, default 2 for CommunityStake)
 * @param chain chainNode to use(must be chain with deployed protocol)
 * @param addresses User address to check balance
 * @param rpcNodeUrl The RPC url of the node
 * @returns balance in wei
 */
export const getNamespaceBalance = async (
  namespaceAddress: string,
  tokenId: number,
  chain: commonProtocol.ValidChains,
  addresses: string[],
  rpcNodeUrl: string,
): Promise<Balances> => {
  const factoryData = commonProtocol.factoryContracts[chain];
  if (rpcNodeUrl) {
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

/**
 * Gets token ticker and decimal places to wei
 */
export const getTokenAttributes = async (
  contestAddress: string,
  rpcNodeUrl: string,
): Promise<TokenAttributes> => {
  const web3 = new Web3(rpcNodeUrl);
  const contest = new web3.eth.Contract(
    contestABI as AbiItem[],
    contestAddress,
  );
  const contestToken: string = await contest.methods.contestToken().call();

  if (contestToken === '0x0000000000000000000000000000000000000000') {
    return Promise.resolve({
      ticker: commonProtocol.Denominations.ETH,
      decimals: commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH],
    });
  }

  const contract = new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ] as AbiItem[],
    contestToken,
  );

  const [symbol, decimals] = await Promise.all([
    contract.methods.symbol().call(),
    contract.methods.decimals().call(),
  ]);

  return {
    ticker: String(symbol),
    decimals: parseInt(String(decimals)),
  };
};
