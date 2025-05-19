import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { isSuperAdmin, mustExist, mustNotExist } from '../../middleware';

export function UpdateTag(): Command<typeof schemas.UpdateTag> {
  return {
    ...schemas.UpdateTag,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { id, name } = payload;

      const tag = await models.Tags.findOne({ where: { id } });
      mustExist('Tag', tag);

      const duplicateTag = await models.Tags.findOne({
        where: { name, id: { [Op.ne]: id } },
      });
      mustNotExist('Tag with this name', duplicateTag);

      const updated = await tag.update({ name });
      const community_count = await models.CommunityTags.count({
        where: { tag_id: id },
      });

      return { ...updated.toJSON(), community_count };
    },
  };
}
