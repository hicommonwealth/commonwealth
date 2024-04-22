import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export const ResumeContestManagerMetadata: Command<
  typeof schemas.commands.ResumeContestManagerMetadata
> = () => ({
  ...schemas.commands.ResumeContestManagerMetadata,
  auth: [],
  body: async ({ id, payload }) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address: id,
      },
    });
    if (mustExist('ContestManager', contestManager)) {
      contestManager.paused = false;
      await contestManager.save();
      return contestManager.get({ plain: true });
    }
  },
});
