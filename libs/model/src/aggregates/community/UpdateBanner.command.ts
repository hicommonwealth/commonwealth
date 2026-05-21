import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';
import { sanitizeBannerText } from '../../utils';

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

      const sanitizedBannerText = sanitizeBannerText(banner_text);

      if (sanitizedBannerText !== community.banner_text) {
        community.banner_text = sanitizedBannerText;
        await community.save();
        return true;
      }
      return false;
    },
  };
}
