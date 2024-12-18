import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';
import { getReferrerId } from '../utils/referrals';

const inputs = {
  CommunityCreated: events.CommunityCreated,
  SignUpFlowCompleted: events.SignUpFlowCompleted,
};

export function UserReferrals(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityCreated: async ({ payload }) => {
        const referral_link = payload.referral_link;
        const referrer_id = getReferrerId(referral_link);
        if (referrer_id) {
          await models.Referral.create({
            referrer_id,
            referee_id: payload.user_id,
            event_name: 'CommunityCreated',
            event_payload: payload,
            created_at: new Date(),
          });
        }
      },
      SignUpFlowCompleted: async ({ payload }) => {
        const referral_link = payload.referral_link;
        const referrer_id = getReferrerId(referral_link);
        if (referrer_id) {
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
