import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../database';

export function GetUserReferrals(): Query<typeof schemas.GetUserReferrals> {
  return {
    ...schemas.GetUserReferrals,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      // only super admin can get referrals for all users
      const id =
        actor.user.isAdmin && payload.user_id ? payload.user_id : actor.user.id;

      const referrals = await models.Referral.findAll({
        where: { referrer_id: id },
        include: [
          {
            model: models.User,
            as: 'referrer',
            attributes: ['id', 'profile'],
          },
          {
            model: models.User,
            as: 'referee',
            attributes: ['id', 'profile'],
          },
        ],
      });

      // format view
      return referrals.map(
        (r) =>
          ({
            referrer: {
              id: r.referrer_id,
              profile: r.referrer!.profile,
            },
            referee: {
              id: r.referee_id,
              profile: r.referee!.profile,
            },
            event_name: r.event_name,
            event_payload: r.event_payload,
            created_at: r.created_at,
          }) as z.infer<typeof schemas.ReferralView>,
      );
    },
  };
}
