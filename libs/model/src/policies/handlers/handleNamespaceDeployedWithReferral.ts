import { EventHandler } from '@hicommonwealth/core';
import { Transaction } from 'sequelize';
import { ZodUndefined } from 'zod';
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
        referrer_received_eth_amount: 0n,
        created_on_chain_timestamp: BigInt(timestamp),
      },
      { transaction },
    );
    await updateReferralCount(referrer_address, transaction);
  });
}

export const handleNamespaceDeployedWithReferral: EventHandler<
  'NamespaceDeployedWithReferral',
  ZodUndefined
> = async ({ payload }) => {
  const {
    referrer: referrer_address,
    namespaceDeployer: referee_address,
    nameSpaceAddress: namespace_address,
  } = payload.parsedArgs;
  if (referrer_address)
    await setReferral(
      namespace_address,
      referrer_address,
      referee_address,
      payload.block.timestamp,
      payload.eventSource.ethChainId,
      payload.rawLog.transactionHash,
      payload.rawLog.removed,
    );
};
