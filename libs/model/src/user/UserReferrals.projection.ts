import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';

const inputs = {
  SignUpFlowCompleted: events.SignUpFlowCompleted,
};

export function UserReferrals(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      SignUpFlowCompleted: async ({ payload }) => {
        if (!payload.referrer_address && !payload.referee_address) return;
        if (payload.referrer_address && payload.referee_address) {
          await models.Referral.create({
            referee_address: payload.referee_address,
            referrer_address: payload.referrer_address,
            referrer_received_eth_amount: 0,
          });
        }
      },
    },
  };
}
