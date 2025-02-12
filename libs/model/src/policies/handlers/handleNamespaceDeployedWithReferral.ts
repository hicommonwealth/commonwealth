import { chainEvents, events } from '@hicommonwealth/schemas';
import { Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

async function updateReferralCount(
  referrer_address: string,
  transaction: Transaction,
) {
  const referrer = await models.User.findOne({
    include: [
      {
        model: models.Address,
        where: { address: referrer_address },
      },
    ],
    transaction,
  });
  referrer &&
    (await referrer.update(
      {
        referral_count: models.sequelize.literal(`
        (SELECT COUNT(DISTINCT referee_address) FROM "Referrals" 
         WHERE referrer_address = ${models.sequelize.escape(referrer_address)})
      `),
      },
      { transaction },
    ));
}

async function setReferral(
  namespace_address: string,
  referrer_address: string,
  referee_address: string,
  timestamp: number,
  eth_chain_id: number,
  transaction_hash: string,
  log_removed: boolean,
) {
  await models.sequelize.transaction(async (transaction) => {
    const existingReferral = await models.Referral.findOne({
      where: { namespace_address, referrer_address },
      transaction,
    });

    // handle on-chain log removals
    if (existingReferral) {
      if (
        existingReferral.transaction_hash === transaction_hash &&
        existingReferral.eth_chain_id === eth_chain_id
      ) {
        if (log_removed) {
          await existingReferral.destroy({ transaction });
          await updateReferralCount(referrer_address, transaction);
        }
        return;
      }
      throw new Error(
        `Found referral of namespace ${namespace_address} with mismatched chain details`,
      );
    }

    await models.Referral.create(
      {
        namespace_address,
        referrer_address,
        referee_address,
        eth_chain_id,
        transaction_hash,
        referrer_received_eth_amount: 0,
        created_on_chain_timestamp: Number(timestamp),
      },
      { transaction },
    );
    await updateReferralCount(referrer_address, transaction);
  });
}

export async function handleNamespaceDeployedWithReferral(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    // 0: namespace_name,
    // 1: fee_manager_address,
    2: referrer_address,
    // 3: referral_fee_manager_contract_address,
    // 4: signature,
    5: referee_address,
    6: namespace_address,
  } = event.parsedArgs as z.infer<
    typeof chainEvents.NamespaceDeployedWithReferral
  >;

  if (referrer_address)
    await setReferral(
      namespace_address,
      referrer_address,
      referee_address,
      event.block.timestamp,
      event.eventSource.ethChainId,
      event.rawLog.transactionHash,
      event.rawLog.removed,
    );
}
