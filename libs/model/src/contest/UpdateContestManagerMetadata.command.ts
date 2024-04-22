import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export const UpdateContestManagerMetadata: Command<
  typeof schemas.commands.UpdateContestManagerMetadata
> = () => ({
  ...schemas.commands.UpdateContestManagerMetadata,
  auth: [],
  body: async ({ id, payload }) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address: id,
      },
    });
    if (mustExist('ContestManager', contestManager)) {
      await contestManager.update({ ...payload });
      return contestManager.get({ plain: true });
    }
  },
});
