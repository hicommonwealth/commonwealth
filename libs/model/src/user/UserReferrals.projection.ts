import { Projection, events, logger } from '@hicommonwealth/core';
import { models } from '../database';

const log = logger(import.meta);

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
          try {
            const referrer_id = parseInt(referral_link.split('_').at(1)!);
            await models.Referral.create({
              referrer_id,
              referee_id: parseInt(payload.userId),
              event_name: 'CommunityCreated',
              event_payload: payload,
              created_at: new Date(),
            });
          } catch (e) {
            // TODO: should we do something else when we fail to create a referral?
            // Logging the error will allows us to manually fix the issue
            e instanceof Error &&
              log.error('Failed to project referral', e, payload);
          }
        }
      },
    },
  };
}
