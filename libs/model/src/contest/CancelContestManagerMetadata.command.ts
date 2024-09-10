import type { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustExist } from '../middleware/guards';

export function CancelContestManagerMetadata(): Command<
  typeof schemas.CancelContestManagerMetadata,
  AuthContext
> {
  return {
    ...schemas.CancelContestManagerMetadata,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.id,
          contest_address: payload.contest_address,
        },
      });
      mustExist('Contest Manager', contestManager);
      contestManager.cancelled = true;
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    },
  };
}
