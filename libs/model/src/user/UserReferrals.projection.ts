import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';

const inputs = {
  CommunityCreated: events.CommunityCreated,
};

async function setReferral(
  user_id: number,
  community_id: string,
  referrer_address: string,
) {
  const referee = await models.Address.findOne({
    where: { user_id, community_id },
    attributes: ['id', 'address'],
  });
  if (!referee) return;

  await models.sequelize.transaction(async (transaction) => {
    await models.Referral.findOrCreate({
      where: { referee_address: referee.address, referrer_address },
      defaults: {
        referee_address: referee.address,
        referrer_address,
        referrer_received_eth_amount: 0,
      },
      transaction,
    });

    // increment the referral count of referrer in this community
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
          referral_count: models.sequelize.literal(
            'coalesce(referral_count, 0) + 1',
          ),
        },
        { transaction },
      ));
  });
}

export function UserReferrals(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityCreated: async ({ payload }) => {
        const { user_id, community_id, referrer_address } = payload;
        if (!referrer_address) return;
        await setReferral(user_id, community_id, referrer_address);
      },
    },
  };
}
