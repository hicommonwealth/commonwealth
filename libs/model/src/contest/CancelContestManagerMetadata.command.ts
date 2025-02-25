import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';

const log = logger(import.meta);

export function CancelContestManagerMetadata(): Command<
  typeof schemas.CancelContestManagerMetadata
> {
  return {
    ...schemas.CancelContestManagerMetadata,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.community_id,
          contest_address: payload.contest_address,
        },
      });
      mustExist('Contest Manager', contestManager);

      // TODO: remove contest manager frames from shared webhook

      contestManager.cancelled = true;
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    },
  };
}
