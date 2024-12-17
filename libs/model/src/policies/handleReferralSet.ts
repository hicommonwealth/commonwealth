import { CustomRetryStrategyError } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { chainEvents, events } from '@hicommonwealth/schemas';
import Web3 from 'web3';
import { z } from 'zod';

export async function handleReferralSet(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const { 0: namespaceAddress, 1: referrerAddress } =
    event.parsedArgs as z.infer<typeof chainEvents.ReferralSet>;

  const existingReferral = await models.Referral.findOne({
    where: {
      eth_chain_id: event.eventSource.ethChainId,
      transaction_hash: event.rawLog.transactionHash,
    },
  });

  if (event.rawLog.removed && existingReferral) {
    await existingReferral.destroy();
    return;
  } else if (existingReferral) return;

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      eth_chain_id: event.eventSource.ethChainId,
    },
  });

  if (!chainNode) {
    // dead-letter with no retries -- should never happen
    throw new CustomRetryStrategyError(
      `Chain node with eth_chain_id ${event.eventSource.ethChainId} not found!`,
      { strategy: 'nack' },
    );
  }

  const web3 = new Web3(chainNode.private_url! || chainNode.url!);
  const block = await web3.eth.getBlock(event.rawLog.blockHash);

  await models.Referral.create({
    eth_chain_id: event.eventSource.ethChainId,
    transaction_hash: event.rawLog.transactionHash,
    namespace_address: namespaceAddress,
    referee_address: event.rawLog.address,
    referrer_address: referrerAddress,
    referrer_received_eth_amount: 0,
    referral_created_timestamp: Number(block.timestamp),
  });
}
