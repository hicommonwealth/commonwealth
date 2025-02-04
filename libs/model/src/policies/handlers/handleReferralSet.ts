import { chainEvents, events } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';

// TODO: remove this handler since it's redundant with handleNamespaceDeployed
export async function handleReferralSet(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const { 0: namespaceAddress, 1: referrerAddress } =
    event.parsedArgs as z.infer<typeof chainEvents.ReferralSet>;

  const existingReferral = await models.Referral.findOne({
    where: {
      referee_address: event.rawLog.address,
      referrer_address: referrerAddress,
    },
  });

  if (
    existingReferral?.transaction_hash === event.rawLog.transactionHash &&
    existingReferral?.eth_chain_id === event.eventSource.ethChainId
  ) {
    // If the txn was removed from the chain due to re-org, convert Referral to incomplete/off-chain only
    if (event.rawLog.removed)
      await existingReferral.update({
        eth_chain_id: null,
        transaction_hash: null,
        namespace_address: null,
        created_on_chain_timestamp: null,
      });

    // Referral already exists
    return;
  }

  // Triggered when an incomplete Referral (off-chain only) was created during user sign up
  if (existingReferral && existingReferral?.eth_chain_id === null) {
    await existingReferral.update({
      eth_chain_id: event.eventSource.ethChainId,
      transaction_hash: event.rawLog.transactionHash,
      namespace_address: namespaceAddress,
      created_on_chain_timestamp: Number(event.block.timestamp),
    });
  }
  // Triggered when the referral was set on-chain only (user didn't sign up i.e. no incomplete Referral)
  // OR when the on-chain referral is on a new chain
  else if (
    !existingReferral ||
    (existingReferral &&
      existingReferral.eth_chain_id !== event.eventSource.ethChainId &&
      existingReferral?.transaction_hash !== event.rawLog.transactionHash)
  ) {
    await models.Referral.create({
      eth_chain_id: event.eventSource.ethChainId,
      transaction_hash: event.rawLog.transactionHash,
      namespace_address: namespaceAddress,
      referee_address: event.rawLog.address,
      referrer_address: referrerAddress,
      referrer_received_eth_amount: 0,
      created_on_chain_timestamp: Number(event.block.timestamp),
    });
  }
}
