import { chainEvents, events } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';

async function setReferral(
  timestamp: number,
  eth_chain_id: number,
  transaction_hash: string,
  namespace_address: string,
  referee_address: string,
  referrer_address: string,
  log_removed: boolean,
) {
  const existingReferral = await models.Referral.findOne({
    where: { referee_address, referrer_address },
  });
  if (existingReferral) {
    if (
      existingReferral.transaction_hash === transaction_hash &&
      existingReferral.eth_chain_id === eth_chain_id
    ) {
      // found with txn but removed from chain
      if (log_removed)
        await existingReferral.update({
          eth_chain_id: null,
          transaction_hash: null,
          namespace_address: null,
          created_on_chain_timestamp: null,
        });
    } else {
      // found with partial or outdated chain details
      await existingReferral.update({
        eth_chain_id,
        transaction_hash,
        namespace_address,
        created_on_chain_timestamp: Number(timestamp),
      });
    }
  } else
    await models.Referral.create({
      eth_chain_id,
      transaction_hash,
      namespace_address,
      referee_address,
      referrer_address,
      referrer_received_eth_amount: 0,
      created_on_chain_timestamp: Number(timestamp),
    });
}

export async function handleNamespaceDeployed(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: namespace_address,
    1: fee_manager_address, // referee address
    // 2: signature,
    // 3: namespace_deployer_address, // referee address
    4: referrer_address,
  } = event.parsedArgs as z.infer<typeof chainEvents.NamespaceDeployed>;

  if (referrer_address)
    await setReferral(
      event.block.timestamp,
      event.eventSource.ethChainId,
      event.rawLog.transactionHash,
      namespace_address,
      fee_manager_address,
      referrer_address,
      event.rawLog.removed,
    );
}
