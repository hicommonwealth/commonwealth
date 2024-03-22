import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import {
  factoryContracts,
  ValidChains,
} from '@hicommonwealth/core/build/commonProtocol/index';
import { Op } from 'sequelize';
import Web3 from 'web3';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

async function createStake(
  web3: Web3,
  transactionHash: string,
  communityId: string,
  communityStakeAddress: string,
) {
  const [transaction, txReceipt] = await Promise.all([
    web3.eth.getTransaction(transactionHash),
    web3.eth.getTransactionReceipt(transactionHash),
  ]);
  const timestamp: number = (
    await web3.eth.getBlock(transaction.blockHash as string)
  ).timestamp as number;

  if (![transaction.from, transaction.to].includes(communityStakeAddress)) {
    throw new Error(
      'This transaction is not associated with a community stake',
    );
  }

  const { 0: stakeId, 1: value } = web3.eth.abi.decodeParameters(
    ['uint256', 'uint256'],
    txReceipt.logs[0].data,
  );

  const {
    0: trader,
    // 1: namespace,
    2: isBuy,
    // 3: communityTokenAmount,
    4: ethAmount,
    // 5: protocolEthAmount,
    // 6: nameSpaceEthAmount,
  } = web3.eth.abi.decodeParameters(
    ['address', 'address', 'bool', 'uint256', 'uint256', 'uint256', 'uint256'],
    txReceipt.logs[1].data,
  );

  const stakeAggregate = await models.StakeTransaction.create({
    transaction_hash: transactionHash,
    community_id: communityId,
    stake_id: parseInt(stakeId),
    stake_amount: parseInt(value),
    stake_price: ethAmount,
    address: trader,
    stake_direction: isBuy ? 'buy' : 'sell',
    timestamp,
  });

  return stakeAggregate?.get({ plain: true });
}

/**
 * This function will first search the database for existing transactions,
 * and create and persist all remaining transactions
 * @constructor
 */
export const CreateStakeTransaction: Command<
  typeof schemas.commands.CreateStakeTransaction
> = () => ({
  ...schemas.commands.CreateStakeTransaction,
  auth: [],
  body: async ({ payload }) => {
    // Find transactions that already exist in database
    const existingTransactions = await models.StakeTransaction.findAll({
      where: {
        transaction_hash: { [Op.in]: payload.transaction_hashes },
        community_id: payload.community_id,
      },
    });

    const stakeAggregates =
      existingTransactions.length > 0
        ? existingTransactions?.get({ plain: true })
        : [];

    const existingTransactionIds = new Set(
      stakeAggregates.map((t) => t.transaction_hash),
    );
    const newTransactionIds = payload.transaction_hashes.filter(
      (t) => !existingTransactionIds.has(t),
    );

    if (newTransactionIds.length === 0) {
      return stakeAggregates;
    }

    // newTransactionIds are the remaining transactions that we must query web3 for.
    const community = await models.Community.findOne({
      where: { id: payload.community_id },
      include: [
        {
          model: models.ChainNode,
          attributes: ['eth_chain_id', 'url'],
        },
        {
          model: models.CommunityStake,
          attributes: ['community_id'],
        },
      ],
    });

    mustExist('Community', community);
    mustExist('Chain Node', community.ChainNode);
    mustExist('Community Stake', community.CommunityStakes);

    if (
      !Object.values(ValidChains).includes(community.ChainNode.eth_chain_id!)
    ) {
      throw Error('Chain does not have deployed namespace factory');
    }

    const web3 = new Web3(community.ChainNode.url);

    const communityStakeAddress: string =
      factoryContracts[community.ChainNode.eth_chain_id as ValidChains]
        .communityStake;

    return [
      ...stakeAggregates,
      ...(await Promise.all(
        newTransactionIds.map((txHash) =>
          createStake(web3, txHash, community.id, communityStakeAddress),
        ),
      )),
    ];
  },
});
