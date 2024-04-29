import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export const PauseContestManagerMetadata: Command<
  typeof schemas.commands.PauseContestManagerMetadata
> = () => ({
  ...schemas.commands.PauseContestManagerMetadata,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        community_id: id,
        contest_address: payload.contest_address,
      },
    });
    if (mustExist('ContestManager', contestManager)) {
      contestManager.paused = true;
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    }
  },
});
