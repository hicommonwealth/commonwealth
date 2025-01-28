import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export function EnableDigestEmail(): Command<typeof schemas.EnableDigestEmail> {
  return {
    ...schemas.EnableDigestEmail,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      const community = await models.Community.findOne({
        where: {
          id: payload.communityId,
        },
      });
      mustExist('community', community);

      const [affectedCount] = await models.Community.update(
        { include_in_digest_email: true },
        {
          where: { id: payload.communityId },
        },
      );
      return {
        success: affectedCount > 0,
      };
    },
  };
}
