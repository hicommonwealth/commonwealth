import { Policy, command } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { SetReachedGoal } from '../aggregates/community';
import { models } from '../database';
import { systemActor } from '../middleware';

const inputs = {
  CommunityJoined: events.CommunityJoined,
};

export function CommunityGoalsPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityJoined: async ({ payload }) => {
        const { community_id } = payload;

        // check if community has any unreached members goal
        const goals = (
          await models.CommunityGoalReached.findAll({
            where: { community_id, reached_at: { [Op.is]: null } },
            include: [
              {
                model: models.CommunityGoalMeta,
                as: 'meta',
                required: true,
                where: { type: 'members' },
              },
            ],
          })
        ).map((g) => g.toJSON());
        if (!goals) return;

        // get community members
        const members = await models.Address.count({
          where: { community_id, verified: { [Op.not]: null } },
        });

        // set reached goals
        goals.forEach(async (goal) => {
          if (goal.meta!.target <= members) {
            await command(SetReachedGoal(), {
              actor: systemActor({}),
              payload: {
                community_id,
                community_goal_meta_id: goal.community_goal_meta_id,
              },
            });
          }
        });
      },
    },
  };
}
