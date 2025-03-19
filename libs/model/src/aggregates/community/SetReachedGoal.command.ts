import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { emitEvent } from 'model/src/utils';
import { models } from '../../database';

export function SetReachedGoal(): Command<typeof schemas.SetReachedGoal> {
  return {
    ...schemas.SetReachedGoal,
    auth: [],
    body: async ({ payload }) => {
      const { community_id, community_goal_meta_id } = payload;

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
          await emitEvent(models.Outbox, [
            {
              event_name: 'CommunityGoalReached',
              event_payload: {
                community_goal_meta_id,
                community_id,
                created_at: now,
              },
            },
          ]);
      });

      return {};
    },
  };
}
