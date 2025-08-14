import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
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
        // First, ensure the system quest and action meta exist for manual XP awards
        let systemQuest = await models.Quest.findOne({
          where: { id: -2 },
          transaction,
        });

        if (!systemQuest) {
          // Create the system quest if it doesn't exist
          systemQuest = await models.Quest.create(
            {
              id: -2,
              name: 'System Quest - Manual Awards',
              description:
                'System quest for manual XP awards and other system-level XP events',
              quest_type: 'common',
              image_url:
                'https://assets.commonwealth.im/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png',
              start_date: new Date('2020-01-01T00:00:00Z'), // Far in the past to always be active
              end_date: new Date('2100-01-01T00:00:00Z'), // Far in the future to always be active
              xp_awarded: 0,
              max_xp_to_end: 999999999, // Very high limit
            },
            { transaction },
          );
        }

        // Ensure the action meta exists for manual XP awards
        let actionMeta = await models.QuestActionMeta.findOne({
          where: { id: -100 },
          transaction,
        });

        if (!actionMeta) {
          // Create the action meta if it doesn't exist
          actionMeta = await models.QuestActionMeta.create(
            {
              id: -100,
              quest_id: -2,
              event_name: 'XpAwarded',
              reward_amount: 0, // Amount comes from the event payload
              creator_reward_weight: 0,
              participation_limit:
                schemas.QuestParticipationLimit.OncePerPeriod,
              participation_period: schemas.QuestParticipationPeriod.Daily,
            },
            { transaction },
          );
        } else if (actionMeta.quest_id !== -2) {
          // Update action meta to point to the correct quest if needed
          await actionMeta.update({ quest_id: -2 }, { transaction });
        }

        // Check that user doesn't have any manual xp awards logged today
        // Use a more robust check that doesn't rely on the join
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const manualXpAwards = await models.XpLog.findAll({
          where: {
            user_id,
            action_meta_id: -100,
            event_created_at: {
              [Op.gte]: today,
              [Op.lt]: tomorrow,
            },
          },
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
