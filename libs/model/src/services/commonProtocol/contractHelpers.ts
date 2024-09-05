import { AppError, InvalidState } from '@hicommonwealth/core';
import {
  BalanceSourceType,
  ZERO_ADDRESS,
  commonProtocol,
} from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { config } from '../../config';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import { Balances, TokenAttributes, getBalances } from '../tokenBalanceCache';
import { contestABI } from './abi/contestAbi';

/**
 * Retrieves a namespace.
 * @param rpcNodeUrl Note this MUST be a private_url with no associated whitelist.
 * @param namespace
 * @param factoryAddress
 */
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

/**
 * Gets token ticker and decimal places to wei
 * @param contestAddress
 * @param rpcNodeUrl Note this MUST be a private_url with no associated whitelist.
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

  if (contestToken === ZERO_ADDRESS) {
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

/**
 * Calculates voting weight of address on a community with stake
 * @param community_id community id
 * @param address user's address
 * @returns voting weight or null if no stake if found
 */
export async function getVotingWeight(
  community_id: string,
  address: string,
): Promise<number | null> {
  if (config.STAKE.REACTION_WEIGHT_OVERRIDE)
    return config.STAKE.REACTION_WEIGHT_OVERRIDE;

  const stake = await models.CommunityStake.findOne({
    where: { community_id },
  });
  if (!stake) return null;

  const community = await models.Community.findByPk(community_id);
  if (!mustExist('Community', community)) return null;
  if (!mustExist('Chain Node Id', community.chain_node_id)) return null;

  const node = await models.ChainNode.findByPk(community.chain_node_id!);
  if (!mustExist('Chain Node', node)) return null;
  if (!mustExist('Eth Chain Id', node.eth_chain_id)) return null;

  const stakeBalances = await getNamespaceBalance(
    community.namespace_address!,
    stake.stake_id,
    node.eth_chain_id,
    [address],
  );
  const stakeBalance = stakeBalances[address];
  if (BigNumber.from(stakeBalance).lte(0))
    throw new InvalidState('Must have stake to upvote');

  return commonProtocol.calculateVoteWeight(stakeBalance, stake.vote_weight);
}
