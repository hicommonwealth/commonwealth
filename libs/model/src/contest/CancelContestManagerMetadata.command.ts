import { command, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles, systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
import { UpdateContestManagerFrameHashes } from './UpdateContestManagerFrameHashes.command';

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

      if (contestManager.farcaster_frame_hashes?.length) {
        await command(UpdateContestManagerFrameHashes(), {
          actor: systemActor({}),
          payload: {
            contest_address: contestManager.contest_address,
            frames_to_remove: contestManager.farcaster_frame_hashes,
          },
        });
      }

      contestManager.cancelled = true;
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    },
  };
}
