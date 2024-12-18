import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetReferralLink(): Query<typeof schemas.GetReferralLink> {
  return {
    ...schemas.GetReferralLink,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const user = await models.User.findOne({
        where: { id: actor.user.id },
        attributes: ['referral_link'],
      });
      return {
        referral_link: user?.referral_link,
      };
    },
  };
}
