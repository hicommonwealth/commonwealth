import { chainEvents, events } from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { z } from 'zod';
import { models } from '../../database';

export async function handleReferralFeeDistributed(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: namespace_address,
    1: distributed_token_address,
    // 2: total_amount_distributed,
    3: referrer_address,
    4: fee_amount,
  } = event.parsedArgs as z.infer<typeof chainEvents.ReferralFeeDistributed>;

  const existingFee = await models.ReferralFee.findOne({
    where: {
      eth_chain_id: event.eventSource.ethChainId,
      transaction_hash: event.rawLog.transactionHash,
    },
  });
  if (existingFee) {
    event.rawLog.removed && (await existingFee.destroy());
    return;
  }

  // find the referral (already mapped to a namespace)
  const referral = await models.Referral.findOne({
    where: { namespace_address, referrer_address },
  });
  if (!referral) return; // we must guarantee the order of chain events here

  const referrer_received_amount = Number(
    BigNumber.from(fee_amount).toBigInt(),
  );

  await models.sequelize.transaction(async (transaction) => {
    await models.ReferralFee.create(
      {
        eth_chain_id: event.eventSource.ethChainId,
        transaction_hash: event.rawLog.transactionHash,
        namespace_address,
        distributed_token_address,
        referrer_recipient_address: referrer_address,
        referrer_received_amount,
        referee_address: referral.referee_address,
        transaction_timestamp: Number(event.block.timestamp),
      },
      { transaction },
    );

    // if native token i.e. ETH
    if (distributed_token_address === ZERO_ADDRESS) {
      const referrer = await models.Address.findOne({
        where: { address: referrer_address },
        transaction,
      });
      if (referrer) {
        await models.User.increment('referral_eth_earnings', {
          by: referrer_received_amount,
          where: { id: referrer.user_id! },
          transaction,
        });
      }

      await referral.increment('referrer_received_eth_amount', {
        by: referrer_received_amount,
        transaction,
      });
    }
  });

  // TODO: on create address update user.referral_eth_earnings by querying referrals
  //  https://github.com/hicommonwealth/commonwealth/issues/10368
}
