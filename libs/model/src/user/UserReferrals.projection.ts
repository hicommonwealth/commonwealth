import { Projection, events } from '@hicommonwealth/core';
import { models } from '../database';

const inputs = {
  CommunityCreated: events.CommunityCreated,
};

export function UserReferrals(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityCreated: async ({ payload }) => {
        const referral_link = payload.referralLink;
        if (referral_link?.startsWith('ref_')) {
          const referrer_id = parseInt(referral_link.split('_').at(1)!);
          await models.Referral.create({
            referrer_id,
            referee_id: parseInt(payload.userId),
            event_name: 'CommunityCreated',
            event_payload: payload,
            created_at: new Date(),
          });
        }
      },
    },
  };
}
