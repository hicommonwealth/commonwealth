import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';

export function UpdateBanner(): Command<typeof schemas.UpdateBanner> {
  return {
    ...schemas.UpdateBanner,
    auth: [authRoles('admin')],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, banner_text } = payload;

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      if (banner_text !== community.banner_text) {
        community.banner_text = banner_text;
        await community.save();
        return true;
      }
      return false;
    },
  };
}
