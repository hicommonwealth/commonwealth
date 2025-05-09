import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { isSuperAdmin, mustExist } from '../../middleware';

export function DeleteTag(): Command<typeof schemas.DeleteTag> {
  return {
    ...schemas.DeleteTag,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { id } = payload;

      const tag = await models.Tags.findOne({ where: { id } });
      mustExist('Tag', tag);

      await models.sequelize.transaction(async (transaction) => {
        await models.CommunityTags.destroy({
          where: { tag_id: id },
          transaction,
        });
        await models.ProfileTags.destroy({
          where: { tag_id: id },
          transaction,
        });
        await tag.destroy({ transaction });
      });

      return true;
    },
  };
}
