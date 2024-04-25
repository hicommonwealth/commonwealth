import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export const CreateContestManagerMetadata: Command<
  typeof schemas.commands.CreateContestManagerMetadata
> = () => ({
  ...schemas.commands.CreateContestManagerMetadata,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const community = await models.Community.findByPk(id!);
    mustExist('Community', community);
    const contestManager = await models.ContestManager.create({
      ...payload,
      community_id: id!,
    });
    if (mustExist('ContestManager', contestManager)) {
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    }
  },
});
