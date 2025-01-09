import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';

const inputs = {
  SignUpFlowCompleted: events.SignUpFlowCompleted,
  CommunityJoined: events.CommunityJoined,
};

export function UserReferrals(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      SignUpFlowCompleted: async ({ payload }) => {
        if (!payload.referrer_address || !payload.referee_address) return;

        await models.Referral.findOrCreate({
          where: {
            referee_address: payload.referee_address,
            referrer_address: payload.referrer_address,
          },
          defaults: {
            referee_address: payload.referee_address,
            referrer_address: payload.referrer_address,
            referrer_received_eth_amount: 0,
          },
        });
      },

      CommunityJoined: async ({ payload }) => {
        const { referrer_address } = payload;
        if (!referrer_address) return;

        const address = await models.Address.findOne({
          where: {
            user_id: payload.user_id,
            community_id: payload.community_id,
          },
          attributes: ['id', 'user_id', 'address'],
        });
        if (!address) return;

        await models.sequelize.transaction(async (transaction) => {
          await models.Referral.findOrCreate({
            where: {
              referee_address: address.address,
              referrer_address,
            },
            defaults: {
              referee_address: address.address,
              referrer_address,
              referrer_received_eth_amount: 0,
            },
            transaction,
          });

          // increment the referral count of referrer in this community
          await models.User.increment('referral_count', {
            by: 1,
            include: [
              {
                model: models.Address,
                where: {
                  address: referrer_address,
                  community_id: payload.community_id,
                },
              },
            ],
            transaction,
          });

          // set the referred_by_address of the address to the address that referred them
          await models.Address.update({
            values: { referred_by_address: address.address },
            where: { id: address.id },
            transaction,
          });
        });
      },
    },
  };
}
