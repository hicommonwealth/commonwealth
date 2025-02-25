import { EventHandler, logger } from '@hicommonwealth/core';
import { getStakeTradeInfo } from '@hicommonwealth/evm-protocols';
import { ZodUndefined } from 'zod';
import { models } from '../../database';
import { chainNodeMustExist } from '../utils/utils';

const log = logger(import.meta);

export const handleCommunityStakeTrades: EventHandler<
  'CommunityStakeTrade',
  ZodUndefined
> = async ({ payload }) => {
  const {
    trader,
    namespace: namespaceAddress,
    isBuy,
    ethAmount,
  } = payload.parsedArgs;

  const existingTxn = await models.StakeTransaction.findOne({
    where: {
      transaction_hash: payload.rawLog.transactionHash,
    },
  });
  if (existingTxn) return;

  const community = await models.Community.findOne({
    where: {
      namespace_address: namespaceAddress,
    },
  });
  if (!community) {
    // Could also be a warning if namespace was created outside of CW
    log.error(
      'Namespace could not be resolved to a community!',
      undefined,
      payload,
    );
    return;
  }

  const chainNode = await chainNodeMustExist(payload.eventSource.ethChainId);

  if (!chainNode.private_url) {
    log.error('ChainNode is missing a private url', undefined, {
      payload,
      chainNode: chainNode.toJSON(),
    });
    return;
  }

  if (community.chain_node_id != chainNode.id) {
    log.error(
      "Event chain node and namespace chain node don't match",
      undefined,
      payload,
    );
    return;
  }

  const stakeInfo = await getStakeTradeInfo({
    rpc: chainNode.private_url,
    txHash: payload.rawLog.transactionHash,
    blockHash: payload.rawLog.blockHash,
  });

  await models.StakeTransaction.create({
    transaction_hash: payload.rawLog.transactionHash,
    community_id: community.id,
    stake_id: stakeInfo.stakeId,
    stake_amount: stakeInfo.stakeAmount,
    stake_price: ethAmount.toString(),
    address: trader,
    stake_direction: isBuy ? 'buy' : 'sell',
    timestamp: stakeInfo.timestamp,
  });
};
