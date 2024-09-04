import type { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export function CancelContestManagerMetadata(): Command<
  typeof schemas.CancelContestManagerMetadata
> {
  return {
    ...schemas.CancelContestManagerMetadata,
    auth: [isCommunityAdmin],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.id,
          contest_address: payload.contest_address,
        },
      });
      if (mustExist('Contest Manager', contestManager)) {
        contestManager.cancelled = true;
        await contestManager.save();
        return {
          contest_managers: [contestManager.get({ plain: true })],
        };
      }
    },
  };
}
