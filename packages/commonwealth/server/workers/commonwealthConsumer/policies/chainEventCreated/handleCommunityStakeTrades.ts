import { schemas } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { DB } from '@hicommonwealth/model';
import { BigNumber } from 'ethers';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function handleCommunityStakeTrades(
  models: DB,
  event: z.infer<typeof schemas.events.ChainEventCreated>,
) {
  const {
    0: trader,
    1: namespaceAddress,
    2: isBuy,
    // 3: communityTokenAmount,
    4: ethAmount,
    // 5: protocolEthAmount,
    // 6: nameSpaceEthAmount,
  } = event.parsedArgs as z.infer<typeof schemas.events.CommunityStakeTrade>;

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

  const chainNode = await models.ChainNode.findOne({
    where: {
      id: event.eventSource.chainNodeId,
    },
  });
  if (!chainNode) {
    log.error('ChainNode associated to chain event not found!', undefined, {
      event,
    });
    return;
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

  const web3 = new Web3(chainNode.private_url || chainNode.url);

  const [tradeTxReceipt, block] = await Promise.all([
    web3.eth.getTransactionReceipt(event.rawLog.transactionHash),
    web3.eth.getBlock(event.rawLog.blockHash),
  ]);

  const { 0: stakeId, 1: stakeAmount } = web3.eth.abi.decodeParameters(
    ['uint256', 'uint256'],
    String(tradeTxReceipt.logs[0].data),
  );

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
