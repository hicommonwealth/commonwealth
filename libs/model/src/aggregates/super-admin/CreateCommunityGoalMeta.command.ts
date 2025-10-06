import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function CreateCommunityGoalMeta(): Command<
  typeof schemas.CreateCommunityGoalMeta
> {
  return {
    ...schemas.CreateCommunityGoalMeta,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { name, description, type, target } = payload;

      const node = await models.CommunityGoalMeta.create({
        name,
        description,
        type,
        target,
      });

      return node.toJSON();
    },
  };
}
