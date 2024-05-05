import type { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import Web3 from 'web3';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

/**
 * This function will first search the database for existing transactions,
 * and create and persist all remaining transactions
 * @constructor
 */
export const CreateStakeTransaction: Command<
  typeof schemas.CreateStakeTransaction
> = () => ({
  ...schemas.CreateStakeTransaction,
  auth: [],
  body: async ({ payload }) => {
    const { transaction_hash } = payload;

    // Find transactions that already exist in database
    const existingTransactions = await models.StakeTransaction.findOne({
      where: {
        transaction_hash: transaction_hash,
      },
    });

    if (existingTransactions) {
      return existingTransactions?.get({ plain: true });
    }

    // newTransactionIds are the remaining transactions that we must query web3 for.
    const community = await models.Community.findOne({
      where: { id: payload.community_id },
      include: [
        {
          model: models.ChainNode.scope('withPrivateData'),
          attributes: ['eth_chain_id', 'url', 'private_url'],
        },
      ],
    });

    mustExist('Community', community);
    mustExist('Chain Node', community!.ChainNode);
    mustExist('Community namespace', community!.namespace);

    if (
      !Object.values(commonProtocol.ValidChains).includes(
        community!.ChainNode!.eth_chain_id!,
      )
    ) {
      throw Error('Chain does not have deployed namespace factory');
    }

    // TODO: @kurtisassad web3 should be encapsulated behind a protocol service
    // TODO: @kurtisassad so we can easily mock chain actions in unit tests
    const web3 = new Web3(
      community!.ChainNode!.private_url || community!.ChainNode!.url,
    );

    const communityStakeAddress: string =
      commonProtocol.factoryContracts[
        community!.ChainNode!.eth_chain_id as commonProtocol.ValidChains
      ].communityStake;

    const [transaction, txReceipt] = await Promise.all([
      web3.eth.getTransaction(transaction_hash),
      web3.eth.getTransactionReceipt(transaction_hash),
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

    const callData = {
      to: txReceipt.logs[0].address, // src of Transfer single
      data: '06fdde03', // name function selector
    };

    const response = await web3.eth.call(callData);
    const name = web3.eth.abi.decodeParameter(
      'string',
      response,
    ) as unknown as string;
    if (name !== community!.namespace!) {
      throw new Error('Transaction is not associated with provided community');
    }

    const {
      0: trader,
      // 1: namespace,
      2: isBuy,
      // 3: communityTokenAmount,
      4: ethAmount,
      // 5: protocolEthAmount,
      // 6: nameSpaceEthAmount,
    } = web3.eth.abi.decodeParameters(
      [
        'address',
        'address',
        'bool',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
      ],
      txReceipt.logs[1].data,
    );

    const stakeAggregate = await models.StakeTransaction.create({
      transaction_hash: transaction_hash,
      community_id: community!.id!,
      stake_id: parseInt(stakeId),
      stake_amount: parseInt(value),
      stake_price: ethAmount,
      address: trader,
      stake_direction: isBuy ? 'buy' : 'sell',
      timestamp: timestamp,
    });

    return stakeAggregate?.get({ plain: true });
  },
});
