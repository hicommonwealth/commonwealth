import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { literal, Op } from 'sequelize';
import { models } from '../../database';
import { isSuperAdmin, mustExist } from '../../middleware';
import { emitEvent } from '../../utils';

export function AwardXp(): Command<typeof schemas.AwardXp> {
  return {
    ...schemas.AwardXp,
    auth: [isSuperAdmin],
    body: async ({ actor, payload }) => {
      const { user_id, xp_amount, reason } = payload;

      const user = await models.User.findOne({ where: { id: user_id } });
      mustExist('User', user);

      await models.sequelize.transaction(async (transaction) => {
        // check that user doesn't have any manual xp awards logged today
        const manualXpAwards = await models.XpLog.findAll({
          where: {
            user_id,
            [Op.and]: [literal('DATE("event_created_at") = CURRENT_DATE')],
          },
          include: [
            {
              model: models.QuestActionMeta,
              as: 'quest_action_meta',
              where: { event_name: 'XpAwarded' },
            },
          ],
          transaction,
        });
        if (manualXpAwards.length > 0) {
          throw new Error('User already has manual XP awards logged today');
        }

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'XpAwarded',
              event_payload: {
                by_user_id: actor.user.id!,
                user_id,
                xp_amount,
                reason,
                created_at: new Date(),
              },
            },
          ],
          transaction,
        );
      });

      return true;
    },
  };
}
