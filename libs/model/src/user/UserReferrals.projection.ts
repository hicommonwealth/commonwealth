import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';

const inputs = {
  CommunityCreated: events.CommunityCreated,
  SignUpFlowCompleted: events.SignUpFlowCompleted,
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
      SignUpFlowCompleted: async ({ payload }) => {
        const referral_link = payload.referral_link;
        if (referral_link?.startsWith('ref_')) {
          const referrer_id = parseInt(referral_link.split('_').at(1)!);
          await models.Referral.create({
            referrer_id,
            referee_id: payload.user_id,
            event_name: 'SignUpFlowCompleted',
            event_payload: payload,
            created_at: new Date(),
          });
        }
      },
    },
  };
}
