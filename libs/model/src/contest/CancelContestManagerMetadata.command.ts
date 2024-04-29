import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export const CancelContestManagerMetadata: Command<
  typeof schemas.commands.CancelContestManagerMetadata
> = () => ({
  ...schemas.commands.CancelContestManagerMetadata,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        community_id: id,
        contest_address: payload.contest_address,
      },
    });
    if (mustExist('ContestManager', contestManager)) {
      contestManager.cancelled = true;
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    }
  },
});
