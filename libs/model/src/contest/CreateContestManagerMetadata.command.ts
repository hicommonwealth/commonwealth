import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export const CreateContestManagerMetadata: Command<
  typeof schemas.commands.CreateContestManagerMetadata
> = () => ({
  ...schemas.commands.CreateContestManagerMetadata,
  auth: [],
  body: async ({ id, payload }) => {
    const community = await models.Community.findByPk(payload.community_id);
    mustExist('Community', community);
    const contestManager = await models.ContestManager.create({
      contest_address: id!,
      ...payload,
    });
    if (mustExist('ContestManager', contestManager)) {
      return contestManager.get({ plain: true });
    }
  },
});
