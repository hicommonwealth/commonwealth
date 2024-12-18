import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';

export const UnpinTokenErrors = {
  NotFound: 'Token not found',
};

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

      if (!pinnedToken) throw new InvalidState(UnpinTokenErrors.NotFound);

      await pinnedToken.destroy();
      return {};
    },
  };
}
