import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function DeleteApiKey(): Command<typeof schemas.DeleteApiKey> {
  return {
    ...schemas.DeleteApiKey,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const numDeleted = await models.ApiKey.destroy({
        where: {
          user_id: actor.user.id,
        },
      });
      return {
        deleted: !!numDeleted,
      };
    },
  };
}
