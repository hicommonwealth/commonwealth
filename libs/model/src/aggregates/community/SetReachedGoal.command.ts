import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { emitEvent } from '../../utils';

export function SetReachedGoal(): Command<typeof schemas.SetReachedGoal> {
  return {
    ...schemas.SetReachedGoal,
    auth: [],
    body: async ({ payload }) => {
      const { community_id, community_goal_meta_id, goal_type } = payload;

      await models.sequelize.transaction(async (transaction) => {
        const now = new Date();
        const [rows] = await models.CommunityGoalReached.update(
          { reached_at: now },
          {
            where: {
              community_id,
              community_goal_meta_id,
              reached_at: null,
            },
            transaction,
          },
        );
        if (rows)
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'CommunityGoalReached',
                event_payload: {
                  community_goal_meta_id,
                  goal_type,
                  community_id,
                  created_at: now,
                },
              },
            ],
            transaction,
          );
      });

      return {};
    },
  };
}
