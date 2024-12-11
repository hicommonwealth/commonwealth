import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';

export function UnpinToken(): Command<typeof schemas.UnpinToken> {
  return {
    ...schemas.UnpinToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id } = payload;
      const pinnedToken = await models.PinnedToken.findOne({
        where: {
          community_id,
        },
      });

      if (!pinnedToken) throw new InvalidState('Token not found');

      await pinnedToken.destroy();
      return {};
    },
  };
}
