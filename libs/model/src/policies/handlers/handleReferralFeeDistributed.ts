import { EventHandler } from '@hicommonwealth/core';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { ZodUndefined } from 'zod';
import { models } from '../../database';

export const handleReferralFeeDistributed: EventHandler<
  'ReferralFeeDistributed',
  ZodUndefined
> = async ({ payload }) => {
  const {
    namespace: namespace_address,
    token: distributed_token_address,
    recipient: referrer_address,
    recipientAmount: fee_amount,
  } = payload.parsedArgs;

  const existingFee = await models.ReferralFee.findOne({
    where: {
      eth_chain_id: payload.eventSource.ethChainId,
      transaction_hash: payload.rawLog.transactionHash,
    },
  });
  if (existingFee) {
    payload.rawLog.removed && (await existingFee.destroy());
    return;
  }

  // find the referral (already mapped to a namespace)
  const referral = await models.Referral.findOne({
    where: { namespace_address, referrer_address },
  });
  if (!referral) return; // we must guarantee the order of chain events here

  const referrer_received_amount = Number(fee_amount) / 1e18;

  await models.sequelize.transaction(async (transaction) => {
    await models.ReferralFee.create(
      {
        eth_chain_id: payload.eventSource.ethChainId,
        transaction_hash: payload.rawLog.transactionHash,
        namespace_address,
        distributed_token_address,
        referrer_recipient_address: referrer_address,
        referrer_received_amount,
        referee_address: referral.referee_address,
        transaction_timestamp: Number(payload.block.timestamp),
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
};
