import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export const UpdateContestManagerMetadata: Command<
  typeof schemas.commands.UpdateContestManagerMetadata
> = () => ({
  ...schemas.commands.UpdateContestManagerMetadata,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        community_id: id,
        contest_address: payload.contest_address,
      },
    });
    if (mustExist('ContestManager', contestManager)) {
      const result = await contestManager.update({ ...payload });
      return {
        contest_managers: [result.get({ plain: true })],
      };
    }
  },
});
