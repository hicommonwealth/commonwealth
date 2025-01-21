import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';

const inputs = {
  CommunityJoined: events.CommunityJoined,
};

export function UserReferrals(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityJoined: async ({ payload }) => {
        const { referrer_address } = payload;
        if (!referrer_address) return;

        const refereeAddress = await models.Address.findOne({
          where: {
            user_id: payload.user_id,
            community_id: payload.community_id,
          },
          attributes: ['id', 'address'],
        });
        if (!refereeAddress) return;

        await models.sequelize.transaction(async (transaction) => {
          await models.Referral.findOrCreate({
            where: {
              referee_address: refereeAddress.address,
              referrer_address,
            },
            defaults: {
              referee_address: refereeAddress.address,
              referrer_address,
              referrer_received_eth_amount: 0,
            },
            transaction,
          });

          // increment the referral count of referrer in this community
          const referrerUser = await models.User.findOne({
            include: [
              {
                model: models.Address,
                attributes: ['id', 'address'],
                where: {
                  address: referrer_address,
                  community_id: payload.community_id,
                },
              },
            ],
            transaction,
          });
          if (referrerUser)
            await referrerUser.update(
              {
                referral_count: models.sequelize.literal(
                  'coalesce(referral_count, 0) + 1',
                ),
              },
              { transaction },
            );
        });
      },
    },
  };
}
