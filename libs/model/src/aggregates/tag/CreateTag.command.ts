import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { isSuperAdmin, mustNotExist } from '../../middleware';

export function CreateTag(): Command<typeof schemas.CreateTag> {
  return {
    ...schemas.CreateTag,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { name } = payload;

      const found = await models.Tags.findOne({ where: { name } });
      mustNotExist('Tag with this name', found);

      return (await models.Tags.create({ name })).toJSON();
    },
  };
}
