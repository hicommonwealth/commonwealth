import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { randomBytes } from 'crypto';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export function CreateReferralLink(): Command<
  typeof schemas.CreateReferralLink
> {
  return {
    ...schemas.CreateReferralLink,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const user = await models.User.findOne({
        where: { id: actor.user.id },
        attributes: ['id', 'referral_link'],
      });
      mustExist('User', user);

      if (user.referral_link)
        throw new InvalidInput('Referral link already exists');

      const randomSegment = randomBytes(8).toString('base64url');
      const referral_link = `ref_${user.id}_${randomSegment}`;

      await user.update({ referral_link });

      return {
        referral_link,
      };
    },
  };
}
