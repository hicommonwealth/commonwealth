import type { Command } from '@hicommonwealth/core';
import {
  commonProtocol,
  getAndVerifyStakeTrade,
} from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

/**
 * This function will first search the database for existing transactions,
 * and create and persist all remaining transactions
 * @constructor
 */
export function CreateStakeTransaction(): Command<
  typeof schemas.CreateStakeTransaction
> {
  return {
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

      const rpc =
        community!.ChainNode!.private_url || community!.ChainNode!.url;

      const res = await getAndVerifyStakeTrade({
        ethChainId: community!.ChainNode!
          .eth_chain_id as commonProtocol.ValidChains,
        rpc,
        txHash: transaction_hash,
        namespace: community.namespace!,
      });

      const stakeAggregate = await models.StakeTransaction.create({
        transaction_hash: transaction_hash,
        community_id: community!.id!,
        stake_id: res.stakeId,
        stake_amount: res.value,
        stake_price: res.ethAmount,
        address: res.traderAddress,
        stake_direction: res.stakeDirection,
        timestamp: res.timestamp,
      });

      return stakeAggregate?.get({ plain: true });
    },
  };
}
