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

      await models.sequelize.transaction(async (transaction) => {
        // cleanup evm event sources
        await models.EvmEventSource.destroy({
          where: {
            contract_address: contestManager.contest_address,
          },
          transaction,
        });

        contestManager.deleted_at = new Date();
        await contestManager.save({ transaction });
      });
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    },
  };
}
