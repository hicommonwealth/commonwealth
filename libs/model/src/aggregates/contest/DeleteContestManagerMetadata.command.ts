import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';

const Errors = {
  ContestNotCancelledOrEnded:
    'Contest Manager must be cancelled or ended to delete',
};

export function DeleteContestManagerMetadata(): Command<
  typeof schemas.DeleteContestManagerMetadata
> {
  return {
    ...schemas.DeleteContestManagerMetadata,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.community_id,
          contest_address: payload.contest_address,
        },
      });
      mustExist('Contest Manager', contestManager);

      if (!contestManager.cancelled && !contestManager.ended) {
        throw new InvalidState(Errors.ContestNotCancelledOrEnded);
      }

      contestManager.deleted_at = new Date();
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    },
  };
}
