import { logger } from '@hicommonwealth/core';
import {
  decodeParameters,
  getBlock,
  getTransactionReceipt,
} from '@hicommonwealth/evm-protocols';
import { chainEvents, events } from '@hicommonwealth/schemas';
import { BigNumber } from 'ethers';
import { z } from 'zod';
import { DB } from '../models';
import { chainNodeMustExist } from './utils';

const log = logger(import.meta);

export async function handleCommunityStakeTrades(
  models: DB,
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: trader,
    1: namespaceAddress,
    2: isBuy,
    // 3: communityTokenAmount,
    4: ethAmount,
    // 5: protocolEthAmount,
    // 6: nameSpaceEthAmount,
  } = event.parsedArgs as z.infer<typeof chainEvents.CommunityStakeTrade>;

  const existingTxn = await models.StakeTransaction.findOne({
    where: {
      transaction_hash: event.rawLog.transactionHash,
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
    log.error('Namespace could not be resolved to a community!', undefined, {
      event,
    });
    return;
  }

  const chainNode = await chainNodeMustExist(event.eventSource.ethChainId);

  if (!chainNode.private_url) {
    log.error('ChainNode is missing a private url', undefined, {
      event,
      chainNode: chainNode.toJSON(),
    });
  }

  if (community.chain_node_id != chainNode.id) {
    log.error(
      "Event chain node and namespace chain node don't match",
      undefined,
      {
        event,
      },
    );
    return;
  }

  const [{ evmClient, txReceipt: tradeTxReceipt }, { block }] =
    await Promise.all([
      getTransactionReceipt({
        rpc: chainNode.private_url!,
        txHash: event.rawLog.transactionHash,
      }),
      getBlock({
        rpc: chainNode.private_url!,
        blockHash: event.rawLog.blockHash,
      }),
    ]);

  const { 0: stakeId, 1: stakeAmount } = decodeParameters({
    evmClient,
    abiInput: ['uint256', 'uint256'],
    data: String(tradeTxReceipt.logs[0].data),
  });

  await models.StakeTransaction.create({
    transaction_hash: event.rawLog.transactionHash,
    community_id: community.id,
    stake_id: parseInt(stakeId as string),
    stake_amount: parseInt(stakeAmount as string),
    stake_price: BigNumber.from(ethAmount).toString(),
    address: trader,
    stake_direction: isBuy ? 'buy' : 'sell',
    timestamp: Number(block.timestamp),
  });
}
