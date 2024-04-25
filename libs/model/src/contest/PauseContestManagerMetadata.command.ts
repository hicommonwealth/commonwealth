import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export const PauseContestManagerMetadata: Command<
  typeof schemas.commands.PauseContestManagerMetadata
> = () => ({
  ...schemas.commands.PauseContestManagerMetadata,
  auth: [],
  body: async ({ id }) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address: id,
      },
    });
    if (mustExist('ContestManager', contestManager)) {
      contestManager.paused = true;
      await contestManager.save();
      return contestManager.get({ plain: true });
    }
  },
});
