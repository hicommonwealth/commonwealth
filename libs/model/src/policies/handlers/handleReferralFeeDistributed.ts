import { chainEvents, events } from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { z } from 'zod';
import { models } from '../../database';

export async function handleReferralFeeDistributed(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: namespaceAddress,
    1: tokenAddress,
    // 2: totalAmountDistributed,
    3: referrerAddress,
    4: referrerReceivedAmount,
  } = event.parsedArgs as z.infer<typeof chainEvents.ReferralFeeDistributed>;

  const existingFee = await models.ReferralFee.findOne({
    where: {
      eth_chain_id: event.eventSource.ethChainId,
      transaction_hash: event.rawLog.transactionHash,
    },
  });

  if (event.rawLog.removed && existingFee) {
    await existingFee.destroy();
    return;
  } else if (existingFee) return;

  const feeAmount =
    Number(BigNumber.from(referrerReceivedAmount).toBigInt()) / 1e18;

  await models.sequelize.transaction(async (transaction) => {
    await models.ReferralFee.create(
      {
        eth_chain_id: event.eventSource.ethChainId,
        transaction_hash: event.rawLog.transactionHash,
        namespace_address: namespaceAddress,
        distributed_token_address: tokenAddress,
        referrer_recipient_address: referrerAddress,
        referrer_received_amount: feeAmount,
        transaction_timestamp: Number(event.block.timestamp),
      },
      { transaction },
    );

    // if native token i.e. ETH
    if (tokenAddress === ZERO_ADDRESS) {
      const userAddress = await models.Address.findOne({
        where: {
          address: referrerAddress,
        },
        transaction,
      });
      if (userAddress) {
        await models.User.increment('referral_eth_earnings', {
          by: feeAmount,
          where: {
            id: userAddress.user_id!,
          },
          transaction,
        });
      }

      await models.Referral.increment('referrer_received_eth_amount', {
        by: feeAmount,
        where: {
          referrer_address: referrerAddress,
          referee_address: event.rawLog.address,
        },
        transaction,
      });
    }
  });

  // TODO: on create address update user.referral_eth_earnings by querying referrals
  //  https://github.com/hicommonwealth/commonwealth/issues/10368
}
